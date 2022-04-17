/**
 * トレーサー・ライブラリ（TRACER）
 *
 * 座標を持ったオブジェクトを移動させるライブラリです。
 *
 * @author Takuto Yanagida
 * @version 2021-02-05
 */


/**
 * ライブラリ変数
 */
const TRACER = (function () {

	'use strict';


	// ライブラリ中だけで使用するユーティリティ --------------------------------


	/**
	 * 角度をラジアンにする
	 * @param {number} deg 角度
	 * @return {number} ラジアン
	 */
	const rad = function (deg) {
		return deg * Math.PI / 180.0;
	};

	/**
	 * 角度を0～360度の範囲にする
	 * @param {number} deg 角度
	 * @return {number} 角度
	 */
	const checkDegRange = function (deg) {
		deg %= 360;
		if (deg < 0) deg += 360;
		return deg;
	};


	/**
	 * トレース・モーション
	 * @version 2021-05-21
	 */
	class TraceMotion {

		/**
		 * トレース・モーションを作る
		 * @constructor
		 */
		constructor() {
			if (typeof PATH === 'undefined') throw new Error('Pathライブラリが必要です。');

			this._cmdQueue = [];
			this._remainTime = 0;
			this._isRepeating = false;

			this._stack = [];

			// 以下の変数は値を直接変えないこと
			this._x       = 0;
			this._y       = 0;
			this._dir     = 0;
			this._step    = 1;
			this._homeX   = 0;
			this._homeY   = 0;
			this._homeDir = 0;

			this._liner = new PATH.Liner({
				lineOrMoveTo : (x, y, dir) => {
					this._changePos(x, y, dir + 90);
				},
				quadCurveOrMoveTo: (x1, y1, x2, y2, dir) => {
					this._changePos(x2, y2, dir + 90);
				},
				bezierCurveOrMoveTo: (x1, y1, x2, y2, x3, y3, dir) => {
					this._changePos(x3, y3, dir + 90);
				},
				arcOrMoveTo: (cx, cy, dr, w, h, r0, r1, ac, dir, xx, yy) => {
					this._changePos(xx, yy, dir + 90);
				}
			});
		}

		/**
		 * 今の状態を保存する
		 * @return {TraceMotion} このモーション
		 */
		save() {
			const t = this._getState();
			this._stack.push(t);
			return this;
		}

		/**
		 * 前の状態を復元する
		 * @return {TraceMotion} このモーション
		 */
		restore() {
			const t = this._stack.pop();
			this._setState(t);
			return this;
		}

		/**
		 * 状態を取得する（ライブラリ内だけで使用）
		 * @private
		 * @return {Array} 状態
		 */
		_getState() {
			return [
				// 以下、順番に依存関係あり
				this._x, this._y, this._dir,
				this._step,
				this._liner.edge(),
				this._homeX, this._homeY, this._homeDir,
			];
		}

		/**
		 * 状態を設定する（ライブラリ内だけで使用）
		 * @private
		 * @param {Array} t 状態
		 */
		_setState(t) {
			this._changePos(t[0], t[1], t[2]);  // 以下、順番に依存関係あり
			this._step = t[3],
			this._liner.edge(t[4]);
			this._homeX = t[5]; this._homeY = t[6]; this._homeDir = t[7];
		}

		/**
		 * 場所や方向を変える時に呼ばれる（ライブラリ内だけで使用）
		 * @private
		 * @param {number} x x座標
		 * @param {number} y y座標
		 * @param {number=} opt_deg 方向（オプション）
		 */
		_changePos(x, y, opt_deg) {
			this._x = x;
			this._y = y;
			if (opt_deg !== undefined) this._dir = checkDegRange(opt_deg);
		}

		/**
		 * 繰り返し動作にする
		 */
		repeat() {
			this._isRepeating = true;
			return this;
		}


		// 場所か方向の変化 --------------------------------------------------------


		/**
		 * 前に進む
		 * @param {number} step 歩数
		 * @return {TraceMotion} このモーション
		 */
		go(step) {
			this._addCommand((limit) => {
				return this._liner.line(this._x, this._y, this._dir - 90, step * this._step, limit);
			});
			return this;
		}

		/**
		 * 後ろに戻る
		 * @param {number} step 歩数
		 * @return {TraceMotion} このモーション
		 */
		back(step) {
			// 前に進むことの逆
			return this.go(-step);
		}

		/**
		 * 右に回る
		 * @param {number} deg 角度
		 * @return {TraceMotion} このモーション
		 */
		turnRight(deg) {
			this._addCommand((limit) => {
				return this._doTurn(deg, limit);
			});
			return this;
		}

		/**
		 * 左に回る
		 * @param {number} deg 角度
		 * @return {TraceMotion} このモーション
		 */
		turnLeft(deg) {
			// 右に回ることの逆
			return this.turnRight(-deg);
		}

		/**
		 * 実際に方向を変える（ライブラリ内だけで使用）
		 * @private
		 * @param {number} deg 角度
		 * @param {number} limit 制限
		 * @return {number} 実際に動いた量
		 */
		_doTurn(deg, limit) {
			const sign = deg < 0 ? -1 : 1;
			let limDeg;
			if (limit !== undefined) {
				limDeg = (limit < sign * deg) ? (sign * limit) : deg;
			} else {
				limDeg = deg;
			}
			this._changePos(this._x, this._y, this._dir + limDeg);
			return sign * limDeg;
		}

		/**
		 * x座標（横の場所）
		 * @param {number=} val 値
		 * @return x座標／このモーション
		 */
		x(val) {
			if (val === undefined) return this._x;
			this._addCommand((limit) => { this._changePos(val, this._y); });
			return this;
		}

		/**
		 * y座標（たての場所）
		 * @param {number=} val 値
		 * @return y座標／このモーション
		 */
		y(val) {
			if (val === undefined) return this._y;
			this._addCommand((limit) => { this._changePos(this._x, val); });
			return this;
		}

		/**
		 * 方向
		 * @param {number=} deg 角度
		 * @return 角度／このモーション
		 */
		direction(deg) {
			if (deg === undefined) return this._dir;
			this._addCommand((limit) => { this._changePos(this._x, this._y, deg); });
			return this;
		}

		/**
		 * 移動する
		 * @param {number} x x座標（横の場所）
		 * @param {number} y y座標（たての場所）
		 * @param {number=} opt_dir 方向（オプション）
		 * @return {TraceMotion} このモーション
		 */
		moveTo(x, y, opt_dir) {
			this._addCommand((limit) => {
				this._changePos(x, y);
				// 値のチェックが必要なので関数呼び出し
				if (opt_dir !== undefined) this._changePos(this._x, this._y, opt_dir);
			});
			return this;
		}

		/**
		 * ホームに帰る（最初の場所と方向に戻る）
		 * @return {TraceMotion} このモーション
		 */
		home() {
			return this.moveTo(this._homeX, this._homeY, this._homeDir);
		}

		/**
		 * 今の場所をホームに
		 * @return {TraceMotion} このモーション
		 */
		setHome() {
			this._addCommand(() => {
				this._homeX   = this._x;
				this._homeY   = this._y;
				this._homeDir = this._dir;
			});
			return this;
		}


		// 場所と方向の変化 --------------------------------------------------------


		/**
		 * 右にカーブする
		 * @param {number} step0 歩数1
		 * @param {number} deg 角度1
		 * @param {number} step1 歩数2
		 * @param {number=} opt_deg 角度2（オプション）
		 * @param {number=} opt_step 歩数3（オプション）
		 * @return {TraceMotion} このモーション
		 */
		curveRight(step0, deg, step1, opt_deg, opt_step) {
			this._addCommand((limit) => {
				return this._doCurve(step0, deg, step1, opt_deg, opt_step, limit);
			});
			return this;
		}

		/**
		 * 左にカーブする
		 * @param {number} step0 歩数1
		 * @param {number} deg 角度1
		 * @param {number} step1 歩数2
		 * @param {number=} opt_deg 角度2（オプション）
		 * @param {number=} opt_step 歩数3（オプション）
		 * @return {TraceMotion} このモーション
		 */
		curveLeft(step0, deg, step1, opt_deg, opt_step) {
			if (opt_deg === undefined) {
				return this.curveRight(step0, -deg, step1);
			} else {
				return this.curveRight(step0, -deg, step1, -opt_deg, opt_step);
			}
		}

		/**
		 * 実際にカーブする（ライブラリ内だけで使用）
		 * @private
		 * @param {number} step0 歩数1
		 * @param {number} deg 角度1
		 * @param {number} step1 歩数2
		 * @param {number} opt_deg 角度2（オプション）
		 * @param {number} opt_step 歩数3（オプション）
		 * @param {number} limit 制限
		 * @return {number} 実際に動いた量
		 */
		_doCurve(step0, deg, step1, opt_deg, opt_step, limit) {
			const s = this._step;
			if (opt_deg === undefined) {
				return this._liner.quadCurve(this._x, this._y, this._dir - 90, step0 * s, deg, step1 * s, limit);
			} else {
				return this._liner.bezierCurve(this._x, this._y, this._dir - 90, step0 * s, deg, step1 * s, opt_deg, opt_step * s, limit);
			}
		}

		/**
		 * 右に曲がる弧をかく
		 * @param {number|number[]} r 半径（配列なら横半径とたて半径）
		 * @param {number|number[]} deg 角度（配列なら開始角度と終了角度）
		 * @return {TraceMotion} このモーション
		 */
		arcRight(r, deg) {
			this._arcPrep(r, deg, false);
			return this;
		}

		/**
		 * 左に曲がる弧をかく
		 * @param {number|number[]} r 半径（配列なら横半径とたて半径）
		 * @param {number|number[]} deg 角度（配列なら開始角度と終了角度）
		 * @return {TraceMotion} このモーション
		 */
		arcLeft(r, deg) {
			this._arcPrep(r, deg, true);
			return this;
		}

		/**
		 * 弧をかく（ライブラリ内だけで使用）
		 * @private
		 * @param {number|number[]} r 半径（配列なら横半径とたて半径）
		 * @param {number|number[]} deg 角度（配列なら開始角度と終了角度）
		 * @param {boolean} isLeft 左かどうか
		 */
		_arcPrep(r, deg, isLeft) {
			this._addCommand((limit) => {
				return this._doArc(r, deg, isLeft, limit);
			});
		}

		/**
		 * 実際に弧をかく（ライブラリ内だけで使用）
		 * @private
		 * @param {number|number[]} r 半径（配列なら横半径とたて半径）
		 * @param {number|number[]} deg 角度（配列なら開始角度と終了角度）
		 * @param {boolean} isLeft 左かどうか
		 * @param {number} limit 制限
		 * @return {number} 実際に動いた量
		 */
		_doArc(r, deg, isLeft, limit) {
			const p = PATH.arrangeArcParams(r, deg, this._step);
			let rev = 0;

			if (isLeft) {
				p.deg0 = -p.deg0;
				p.deg1 = -p.deg1;
			} else {
				p.deg0 = p.deg0 + 180;
				p.deg1 = p.deg1 + 180;
				// 時計回りの接線の傾きなのでPIを足す（逆向きにする）
				rev = Math.PI;
			}
			const r0 = rad(p.deg0);
			const s0 = p.w * Math.cos(r0), t0 = p.h * Math.sin(r0);
			const a0 = Math.atan2(-(p.h * p.h * s0), (p.w * p.w * t0)) + rev;

			const rot = rad(this._dir - 90) - a0;
			const sin = Math.sin(rot), cos = Math.cos(rot);
			const lsp = this._x + -s0 * cos - -t0 * sin;
			const ltp = this._y + -s0 * sin + -t0 * cos;

			return this._liner.arc(lsp, ltp, rot * 180.0 / Math.PI, p.w, p.h, p.deg0, p.deg1, isLeft, limit);
		}


		// その他 ------------------------------------------------------------------


		/**
		 * 1歩の長さ
		 * @param {number=} val 値
		 * @return {number|TraceMotion} 1歩の長さ／このモーション
		 */
		step(val) {
			if (val === undefined) return this._step;
			this._addCommand(() => { this._step = val; });
			return this;
		}

		/**
		 * エッジ
		 * @param {function=} func エッジを決める関数
		 * @return {function|TraceMotion} エッジ／このモーション
		 */
		edge(func, ...fs) {
			if (func === undefined) return this._liner.edge();
			this._addCommand(() => { this._liner.edge(func, ...fs); });
			return this;
		}

		/**
		 * 今の場所から見て、ある場所がどの角度かを返す
		 * @param {number} x ある場所のx座標（横の場所）
		 * @param {number} y ある場所のy座標（たての場所）
		 * @return {number} 角度
		 */
		getDirectionOf(x, y) {
			return (Math.atan2(y - this._y, x - this._x) * 180.0 / Math.PI - this._dir - 90);
		}


		// アニメーション ----------------------------------------------------------


		/**
		 * 後で実行する
		 * @param {function} func 関数
		 * @param {Array=} args_array 関数に渡す引数
		 * @return {TraceMotion} このモーション
		 */
		doLater(func, args_array = []) {
			this._addCommand(() => func(...args_array));
			return this;
		}

		/**
		 * 直ぐに実行する
		 * @param {function} func 関数
		 * @param {Array=} args_array 関数に渡す引数
		 * @return {TraceMotion} このモーション
		 */
		doNow(func, args_array = []) {
			const fn = () => func(...args_array);

			if (this._cmdQueue.length > 0) {
				const c = this._cmdQueue[0];
				const cmd = new Command(fn);
				if (c._isFirstTime) {
					this._cmdQueue.unshift(cmd);
				} else {
					this._cmdQueue.splice(1, 0, cmd);
				}
			} else {
				this._addCommand(fn);
			}
			return this;
		}

		/**
		 * コマンドを追加する（ライブラリ内だけで使用）
		 * @private
		 * @param {function} func 関数
		 */
		_addCommand(func) {
			this._cmdQueue.push(new Command(func));
		}

		/**
		 * アニメーションを次に進める
		 * @param {number} num フレーム数
		 */
		stepNext(num) {
			this.update(num, this._x, this._y, this._dir);
		}

		/**
		 * スピードに合わせて座標を更新する
		 * @param {number} unitTime 単位時間
		 * @param {number} x x座標（横の場所）
		 * @param {number} y y座標（たての場所）
		 * @param {number} dir 方向
		 * @return {number[]} 座標
		 */
		update(unitTime, x, y, dir) {
			if (this._x !== x || this._y !== y || this._dir !== dir) {
				this.cancel();
				this._changePos(x, y, dir);
			}
			if (0 < this._cmdQueue.length) this._remainTime += unitTime;
			const rq = [];
			while (0 < this._cmdQueue.length) {
				const c = this._cmdQueue[0];
				if (c._initState === null) {
					c._initState = this._getState();
				} else {
					this._setState(c._initState);
				}
				const remain = this._remainTime - c.run(this._remainTime);
				if (0 < remain) {
					this._cmdQueue.shift();
					this._remainTime = remain;
					if (this._isRepeating) {
						c._initState = null;
						rq.push(c);
					}
				} else {
					break;
				}
			}
			if (0 === this._cmdQueue.length) this._remainTime = 0;
			for (const c of rq) this._cmdQueue.push(c);
			return [this._x, this._y, this._dir];
		}

		/**
		 * 現在の動きをキャンセルする
		 * @return {TraceMotion} このモーション
		 */
		cancel() {
			if (0 < this._cmdQueue.length) {
				const c = this._cmdQueue[0];
				if (c._initState !== null) {
					this._setState(c._initState);
					this._cmdQueue.shift();
					this._remainTime = 0;
					if (this._isRepeating) {
						c._initState = null;
						this._cmdQueue.push(c);
					}
				}
			}
			return this;
		}

		/**
		 * すべての動きを止める
		 * @return {TraceMotion} このモーション
		 */
		stop() {
			this._cmdQueue.length = 0;
			this._remainTime = 0;
			return this;
		}

	}


	/**
	 * コマンド
	 * @version 2021-02-05
	 */
	class Command {

		/**
		 * コマンドを作る（ライブラリ内だけで使用）
		 * @private
		 * @constructor
		 * @param {function} func 関数
		 */
		constructor(func) {
			this._func = func;
			this._initState = null;
		}

		/**
		 * コマンドを実行する（ライブラリ内だけで使用）
		 * @param {number} deltaTime 進める時間
		 * @return {number} パワー消費
		 */
		run(deltaTime) {
			const pc = this._func(deltaTime);
			return (pc === undefined) ? 0 : pc;
		}

	}


	// ライブラリを作る --------------------------------------------------------


	// 関数の別名
	const aliasMap = {
		go            : ['forward', 'fd'],
		back          : ['bk', 'backward'],
		step          : ['unit'],
		turnRight     : ['tr', 'right', 'rt'],
		turnLeft      : ['tl', 'left', 'lt'],
		direction     : ['heading'],
		curveRight    : ['cr'],
		curveLeft     : ['cl'],
		arcRight      : ['ar'],
		arcLeft       : ['al'],
		getDirectionOf: ['towards'],
	};

	// 関数の別名を登録する
	for (const [orig, as] of Object.entries(aliasMap)) {
		for (const a of as) {
			TraceMotion.prototype[a] = TraceMotion.prototype[orig];
		}
	}

	return { TraceMotion };

}());
