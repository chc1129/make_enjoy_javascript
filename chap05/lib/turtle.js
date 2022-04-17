/**
 * タートル・ライブラリ（TURTLE）
 *
 * カメを動かして、絵をかくためのライブラリです。
 *
 * @author Takuto Yanagida
 * @version 2021-10-10
 */


/**
 * ライブラリ変数
 */
const TURTLE = (function () {

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
	 * 座標に行列を適用する
	 * @param {object} t 行列
	 * @param {number} x x座標
	 * @param {number} y y座標
	 */
	const transform = function (t, x, y) {
		if (t === null) return [x, y];
		const nx = t.a * x + t.c * y + t.e;
		const ny = t.b * x + t.d * y + t.f;
		return [nx, ny];
	}

	/**
	 * 座標を回転する
	 * @param {number} r ラジアン
	 * @param {number} x x座標
	 * @param {number} y y座標
	 */
	const rotate = function (r, x, y) {
		const s = Math.sin(r);
		const c = Math.cos(r);
		return [x * c - y * s, x * s + y * c];
	}


	/**
	 * タートル・ベース
	 * @version 2021-05-21
	 */
	class TurtleBase {

		/**
		 * カメを作る
		 * @constructor
		 * @param {Paper|CanvasRenderingContext2D} ctx 紙／キャンバス・コンテキスト
		 * @param {number=} normalDeg 標準の方向
		 */
		constructor(ctx, normalDeg) {
			if (typeof STYLE === 'undefined') throw new Error('Styleライブラリが必要です。');
			if (typeof PATH === 'undefined') throw new Error('Pathライブラリが必要です。');

			this._ctx = ctx;
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
				lineOrMoveTo: (x, y, dir) => {
					if (this._pen) this._ctx.lineTo(x, y);
					this._changePos(x, y, dir + 90);
				},
				quadCurveOrMoveTo: (x1, y1, x2, y2, dir) => {
					if (this._pen) this._ctx.quadraticCurveTo(x1, y1, x2, y2);
					this._changePos(x2, y2, dir + 90);
				},
				bezierCurveOrMoveTo: (x1, y1, x2, y2, x3, y3, dir) => {
					if (this._pen) this._ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3);
					this._changePos(x3, y3, dir + 90);
				},
				arcOrMoveTo: (cx, cy, dr, w, h, r0, r1, ac, dir, xx, yy) => {
					if (this._pen) PATH.eclipse(this._ctx, cx, cy, w, h, dr, r0, r1, ac);
					this._changePos(xx, yy, dir + 90);
				}
			}, normalDeg ? rad(normalDeg) : undefined);

			this._area = { fromX: 0, toX: 0, left: 0, right: 0, fromY: 0, toY: 0, top: 0, bottom: 0, sqLen: 0 };
			this._mode = 'stroke';
			this._stroke = new STYLE.Stroke();
			this._fill = new STYLE.Fill();
			this._curMode = this._mode;
			this._pen = false;

			this._isClippable = true;
		}

		/**
		 * 子カメを作る
		 * @return {*} 子カメ
		 */
		makeChild() {
			const child = new this.constructor(this._ctx);
			child._setState(this._getState(), false);
			// ペンの上げ下げをできなくする
			child.pen = () => { return this; };
			return child;
		}

		/**
		 * 今の状態を保存する
		 * @param {boolean=} [opt_savePaper=false] 紙の状態も保存するか？
		 * @return {TurtleBase} このタートル・ベース
		 */
		save(opt_savePaper = false) {
			if (opt_savePaper === true) this._ctx.save();
			this._stack.push(this._getState());
			return this;
		}

		/**
		 * 前の状態を復元する
		 * @param {boolean=} [opt_restorePaper=false] 紙の状態も復元するか？
		 * @return {TurtleBase} このタートル・ベース
		 */
		restore(opt_restorePaper = false) {
			this._setState(this._stack.pop());
			if (opt_restorePaper === true) this._ctx.restore();
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
				Object.assign({}, this._area),
				this._mode,
				new STYLE.Stroke(this._stroke),
				new STYLE.Fill(this._fill),
				this._curMode,
				// ペンの状態は最後
				this._pen,
			];
		}

		/**
		 * 状態を設定する（ライブラリ内だけで使用）
		 * @private
		 * @param {Array} t 状態
		 * @param {boolean=} [applyPenState=true] ペンの状態を設定するか？
		 */
		_setState(t, applyPenState = true) {
			// 以下、順番に依存関係あり
			this._changePos(t[0], t[1], t[2]);
			this.step(t[3]);
			this._liner.edge(t[4]);
			this._homeX = t[5]; this._homeY = t[6]; this._homeDir = t[7];
			this._area = t[8];
			this.mode(t[9]);
			this._stroke = t[10];
			this._fill = t[11];
			this._curMode = t[12];
			// ペンの状態は最後に設定すること（area等を参照しているため）
			if (applyPenState === true) this.pen(t[13]);
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
		 * アニメーション用プレースホルダ（アニメーションのスキップをチェックする）（ライブラリ内だけで使用）
		 * @private
		 */
		_getPower() {
			return null;
		}

		/**
		 * アニメーション用プレースホルダ（アニメーションの終わりをチェックする）（ライブラリ内だけで使用）
		 * @private
		 * @param {number} consumption
		 */
		_usePower(consumption) {
		}


		// 場所か方向の変化 --------------------------------------------------------


		/**
		 * 前に進む
		 * @param {number} step 歩数
		 * @return {TurtleBase} このタートル・ベース
		 */
		go(step) {
			return this._goPrep(step);
		}

		/**
		 * 後ろに戻る
		 * @param {number} step 歩数
		 * @return {TurtleBase} このタートル・ベース
		 */
		back(step) {
			// 前に進むことの逆
			return this._goPrep(-step);
		}

		/**
		 * 進む（ライブラリ内だけで使用）
		 * @private
		 * @param {number} step 歩数
		 * @return {TurtleBase} このタートル・ベース
		 */
		_goPrep(step) {
			const limit = this._getPower();
			if (limit === 0) return this;
			this._usePower(this._doGo(step, limit));
			return this;
		}

		/**
		 * 実際に進む（ライブラリ内だけで使用）
		 * @private
		 * @param {number} step 歩数
		 * @param {number} limit 制限
		 * @param {function=} [before=null] 実際に動く前に呼ばれる関数
		 * @return {number} 実際に動いた量
		 */
		_doGo(step, limit, before = null) {
			const x = this._x, y = this._y, dir_ = this._dir - 90, d = step * this._step;
			if (before) before(x, y, dir_, d);
			return this._liner.line(x, y, dir_, d, limit, this._area);
		}

		/**
		 * 右に回る
		 * @param {number} deg 角度
		 * @return {TurtleBase} このタートル・ベース
		 */
		turnRight(deg) {
			return this._turnPrep(deg);
		}

		/**
		 * 左に回る
		 * @param {number} deg 角度
		 * @return {TurtleBase} このタートル・ベース
		 */
		turnLeft(deg) {
			// 右に回ることの逆
			return this._turnPrep(-deg);
		}

		/**
		 * 回る（ライブラリ内だけで使用）
		 * @private
		 * @param {number} deg 角度
		 * @return {TurtleBase} このタートル・ベース
		 */
		_turnPrep(deg) {
			const limit = this._getPower();
			if (limit === 0) return this;
			this._usePower(this._doTurn(deg, limit));
			return this;
		}

		/**
		 * 実際に方向を変える（ライブラリ内だけで使用）
		 * @private
		 * @param {number} deg 角度
		 * @param {number} limit 制限
		 * @param {function=} [before=null] 実際に動く前に呼ばれる関数
		 * @return {number} 実際に動いた量
		 */
		_doTurn(deg, limit, before = null) {
			const sign = (deg < 0 ? -1 : 1), d = sign * deg;
			let cons;
			if (limit !== null) {
				const f = (90 < d) ? 1 : ((d < 10) ? 5 : (5 - 4 * (d - 10) / 80));  // 10 ~ 90 => 5 ~ 1
				const need = d * f;
				if (limit < need) deg = sign * limit / f;
				cons = Math.min(limit, need);
			} else {
				cons = d;
			}
			if (before) before(this._x, this._y);
			this._changePos(this._x, this._y, this._dir + deg);
			return cons;
		}

		/**
		 * x座標（横の場所）
		 * @param {number=} val 値
		 * @return x座標／このタートル・ベース
		 */
		x(val) {
			if (val === undefined) return this._x;
			return this.moveTo(val, this._y);
		}

		/**
		 * y座標（たての場所）
		 * @param {number=} val 値
		 * @return y座標／このタートル・ベース
		 */
		y(val) {
			if (val === undefined) return this._y;
			return this.moveTo(this._x, val);
		}

		/**
		 * 方向
		 * @param {number=} deg 角度
		 * @return 角度／このタートル・ベース
		 */
		direction(deg) {
			if (deg === undefined) return this._dir;
			if (this._getPower() === 0) return this;
			this._changePos(this._x, this._y, deg);
			return this;
		}

		/**
		 * 移動する
		 * @param {number} x x座標
		 * @param {number} y y座標
		 * @param {number=} opt_dir 方向（オプション）
		 * @return {TurtleBase} このタートル・ベース
		 */
		moveTo(x, y, opt_dir) {
			if (this._getPower() === 0) return this;
			if (this._pen) {
				const dir = Math.atan2(y - this._y, x - this._x) * 180.0 / Math.PI;
				const dist = Math.sqrt((x - this._x) * (x - this._x) + (y - this._y) * (y - this._y));
				this._liner.line(this._x, this._y, dir, dist, null, this._area);
			}
			this._changePos(x, y, opt_dir);
			return this;
		}

		/**
		 * 集まる
		 * @param {TurtleBase} turtle 別のカメ
		 * @return {TurtleBase} このタートル・ベース
		 */
		gatherTo(turtle) {
			return this.moveTo(turtle._x, turtle._y, turtle._dir);
		}

		/**
		 * ホームに帰る（最初の場所と方向に戻る）
		 * @return {TurtleBase} このタートル・ベース
		 */
		home() {
			return this.moveTo(this._homeX, this._homeY, this._homeDir);
		}

		/**
		 * 今の場所をホームに
		 * @return {TurtleBase} このタートル・ベース
		 */
		setHome() {
			if (this._getPower() === 0) return this;
			this._homeX = this._x;
			this._homeY = this._y;
			this._homeDir = this._dir;
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
		 * @return {TurtleBase} このタートル・ベース
		 */
		curveRight(step0, deg, step1, opt_deg, opt_step) {
			return this._curvePrep(step0, deg, step1, opt_deg, opt_step);
		}

		/**
		 * 左にカーブする
		 * @param {number} step0 歩数1
		 * @param {number} deg 角度1
		 * @param {number} step1 歩数2
		 * @param {number=} opt_deg 角度2（オプション）
		 * @param {number=} opt_step 歩数3（オプション）
		 * @return {TurtleBase} このタートル・ベース
		 */
		curveLeft(step0, deg, step1, opt_deg, opt_step) {
			if (opt_deg === undefined) return this._curvePrep(step0, -deg, step1);
			return this._curvePrep(step0, -deg, step1, -opt_deg, opt_step);
		}

		/**
		 * カーブする（ライブラリ内だけで使用）
		 * @private
		 * @param {number} step0 歩数1
		 * @param {number} deg 角度1
		 * @param {number} step1 歩数2
		 * @param {number=} opt_deg 角度2（オプション）
		 * @param {number=} opt_step 歩数3（オプション）
		 * @return {TurtleBase} このタートル・ベース
		 */
		_curvePrep(step0, deg, step1, opt_deg, opt_step) {
			const limit = this._getPower();
			if (limit === 0) return this;
			this._usePower(this._doCurve(step0, deg, step1, opt_deg, opt_step, limit));
			return this;
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
		 * @param {function=} [before=null] 実際に動く前に呼ばれる関数
		 * @return {number} 実際に動いた量
		 */
		_doCurve(step0, deg, step1, opt_deg, opt_step, limit, before = null) {
			const x = this._x, y = this._y, dir_ = this._dir - 90, s = this._step;
			const d0 = step0 * s, d1 = step1 * s;

			if (opt_deg === undefined) {
				if (before) before(x, y, dir_, d0, deg, d1);
				return this._liner.quadCurve(x, y, dir_, d0, deg, d1, limit, this._area);
			} else {
				const d2 = opt_step * s;
				if (before) before(x, y, dir_, d0, deg, d1, opt_deg, d2);
				return this._liner.bezierCurve(x, y, dir_, d0, deg, d1, opt_deg, d2, limit, this._area);
			}
		}

		/**
		 * 右に曲がる弧をかく
		 * @param {number|number[]} r 半径（配列なら横半径とたて半径）
		 * @param {number|number[]} deg 角度（配列なら開始角度と終了角度）
		 * @return {TurtleBase} このタートル・ベース
		 */
		arcRight(r, deg) {
			return this._arcPrep(r, deg, false);
		}

		/**
		 * 左に曲がる弧をかく
		 * @param {number|number[]} r 半径（配列なら横半径とたて半径）
		 * @param {number|number[]} deg 角度（配列なら開始角度と終了角度）
		 * @return {TurtleBase} このタートル・ベース
		 */
		arcLeft(r, deg) {
			return this._arcPrep(r, deg, true);
		}

		/**
		 * 弧をかく（ライブラリ内だけで使用）
		 * @private
		 * @param {number|number[]} r 半径（配列なら横半径とたて半径）
		 * @param {number|number[]} deg 角度（配列なら開始角度と終了角度）
		 * @param {boolean} isLeft 左かどうか
		 * @return {TurtleBase} このタートル・ベース
		 */
		_arcPrep(r, deg, isLeft) {
			const limit = this._getPower();
			if (limit === 0) return this;
			this._usePower(this._doArc(r, deg, isLeft, limit));
			return this;
		}

		/**
		 * 実際に弧をかく（ライブラリ内だけで使用）
		 * @private
		 * @param {number|number[]} r 半径（配列なら横半径とたて半径）
		 * @param {number|number[]} deg 角度（配列なら開始角度と終了角度）
		 * @param {boolean} isLeft 左かどうか
		 * @param {number} limit 制限
		 * @param {function=} [before=null] 実際に動く前に呼ばれる関数
		 * @return {number} 実際に動いた量
		 */
		_doArc(r, deg, isLeft, limit, before = null) {
			const p = PATH.arrangeArcParams(r, deg, this._step);
			// 時計回りの接線の傾きなのでPIを足す（逆向きにする）
			const rev = isLeft ? 0 : Math.PI;

			if (isLeft) {
				p.deg0 = -p.deg0;
				p.deg1 = -p.deg1;
			} else {
				p.deg0 = p.deg0 + 180;
				p.deg1 = p.deg1 + 180;
			}
			const r0 = rad(p.deg0);
			const s0 = p.w * Math.cos(r0), t0 = p.h * Math.sin(r0);
			const a0 = Math.atan2(-(p.h * p.h * s0), (p.w * p.w * t0)) + rev;

			const rot = rad(this._dir - 90) - a0;
			const sin = Math.sin(rot), cos = Math.cos(rot);
			const lsp = this._x + -s0 * cos - -t0 * sin;
			const ltp = this._y + -s0 * sin + -t0 * cos;

			if (before) before(lsp, ltp, rot, p);
			return this._liner.arc(lsp, ltp, rot * 180.0 / Math.PI, p.w, p.h, p.deg0, p.deg1, isLeft, limit, this._area);
		}


		// その他 ------------------------------------------------------------------


		/**
		 * 1歩の長さ
		 * @param {number=} val 値
		 * @return {number|TurtleBase} 1歩の長さ／このタートル・ベース
		 */
		step(val) {
			if (val === undefined) return this._step;
			this._step = val;
			return this;
		}

		/**
		 * 今の場所から見て、ある場所がどの角度かを返す
		 * @param {number} x ある場所のx座標（横の場所）
		 * @param {number} y ある場所のy座標（たての場所）
		 * @return {number} 角度
		 */
		getDirectionOf(x, y) {
			let d = (Math.atan2(this._y - y, this._x - x) * 180.0 / Math.PI - this._dir - 90);
			while (d < 0) d += 360;
			while (360 <= d) d -= 360;
			return d;
		}

		/**
		 * 今の場所から見て、ホームがどの角度かを返す
		 * @return {number} 角度
		 */
		getDirectionOfHome() {
			return this.getDirectionOf(this._homeX, this._homeY);
		}

		/**
		 * 今の場所から、ある場所までの距離を返す
		 * @param {number} x ある場所のx座標
		 * @param {number} y ある場所のy座標
		 * @return {number} 距離
		 */
		getDistanceTo(x, y) {
			return Math.sqrt((x - this._x) * (x - this._x) + (y - this._y) * (y - this._y));
		}

		/**
		 * 今の場所から、ホームまでの距離を返す
		 * @return {number} 距離
		 */
		getDistanceToHome() {
			return this.getDistanceTo(this._homeX, this._homeY);
		}


		// 図形の描画 --------------------------------------------------------------


		/**
		 * 点をかく
		 * @return {TurtleBase} このタートル・ベース
		 */
		dot() {
			this._drawShape((limit) => {
				let r = this._stroke._width / 2;
				if (limit) r = Math.min(r, limit);
				const dr0 = rad(this._dir - 90), offX = r * Math.cos(dr0), offY = r * Math.sin(dr0);

				this._area.fromX = this._x - offX, this._area.fromY = this._y - offY;
				this._area.toX = this._x + offX, this._area.toY = this._y + offY;
				this._area.left = this._x - r, this._area.top = this._y - r;
				this._area.right = this._x + r, this._area.bottom = this._y + r;

				if (this._pen) this._ctx.arc(this._x, this._y, r, 0, 2 * Math.PI, false);
				return r;
			});
			return this;
		}

		/**
		 * 円をかく
		 * @param {number|number[]} r 半径（配列なら横半径とたて半径）
		 * @param {number|number[]=} [deg=360] 弧の角度（配列なら開始角度と終了角度）
		 * @param {boolean=} [anticlockwise=false] 反時計回り？
		 * @return {TurtleBase} このタートル・ベース
		 */
		circle(r, deg = 360, anticlockwise = false) {
			const p = PATH.arrangeArcParams(r, deg, this._step);
			const cx = this._x, cy = this._y;
			const dr0 = rad(p.deg0 - 90), s1 = p.w * Math.cos(dr0), t1 = p.h * Math.sin(dr0);
			const dr = rad(this._dir), sin = Math.sin(dr), cos = Math.cos(dr);
			const x0 = cx + s1 * cos - t1 * sin, y0 = cy + s1 * sin + t1 * cos;

			this._drawShape((limit) => { return this._doCircle(cx, cy, p, anticlockwise, limit, dr); }, x0, y0);
			return this;
		}

		/**
		 * 実際に円をかく（ライブラリ内だけで使用）
		 * @private
		 * @param {number} cx 中心のx座標
		 * @param {number} cy 中心のy座標
		 * @param {dict} p パラメター
		 * @param {boolean} anticlockwise 反時計回り？
		 * @param {number} limit 制限
		 * @param {number} dr 方向
		 * @param {function=} [before=null] 実際に動く前に呼ばれる関数
		 * @return {number} 実際に動いた量
		 */
		_doCircle(cx, cy, p, anticlockwise, limit, dr, before = null) {
			if (before) before(cx, cy, p, dr);
			return this._liner.arc(cx, cy, this._dir, p.w, p.h, p.deg0 - 90, p.deg1 - 90, anticlockwise, limit, this._area);
		}

		/**
		 * 実際に絵をかく（ライブラリ内だけで使用）
		 * @private
		 * @param {function} doFunc 関数
		 * @param {number=} [opt_x=null] 始点のx座標
		 * @param {number=} [opt_y=null] 始点のy座標
		 */
		_drawShape(doFunc, opt_x = null, opt_y = null) {
			const limit = this._getPower();
			if (limit === 0) return;
			const pen = this._pen;

			this.save();
			if (pen) this.penUp();
			if (opt_x !== null && opt_y !== null) this.moveTo(opt_x, opt_y);
			if (pen) this.penDown();
			this._usePower(doFunc(limit));
			if (pen) this.penUp();
			this.restore();
		}

		/**
		 * イメージをかく
		 * @param {Image|Paper|CanvasRenderingContext2D} image イメージ／紙／キャンバス・コンテキスト
		 * @param {number} cx 中心のx座標
		 * @param {number} cy 中心のy座標
		 * @param {number=} [scale=1] スケール
		 */
		image(image, cx, cy, scale = 1) {
			const img = (image instanceof CROQUJS.Paper || image instanceof CanvasRenderingContext2D) ? image.canvas : image;
			this._ctx.save();
			this.localize();
			this._ctx.drawImage(img, -cx * scale, -cy * scale, img.width * scale, img.height * scale);
			this._ctx.restore();
		}


		// 描画状態の変化 ----------------------------------------------------------


		/**
		 * ペンを上げる
		 * @return {TurtleBase} このタートル・ベース
		 */
		penUp() {
			return this.pen(false);
		}

		/**
		 * ペンを下ろす
		 * @return {TurtleBase} このタートル・ベース
		 */
		penDown() {
			return this.pen(true);
		}

		/**
		 * ペンの状態
		 * @param {boolean=} val 値（下がっているならtrue）
		 * @return {boolean|TurtleBase} ペンの状態／このタートル・ベース
		 */
		pen(val) {
			if (val === undefined) return this._pen;
			if (this._pen === false && val === true) {
				this._ctx.beginPath();
				this._ctx.moveTo(this._x, this._y);
				// ペンを下げた場所を保存しておく
				this._area.fromX = this._area.left = this._area.right = this._x;
				this._area.fromY = this._area.top = this._area.bottom = this._y;
				this._area.sqLen = 0;
				this._curMode = this._mode.toLowerCase();
			}
			if (this._pen === true && val === false && !this._isNotDrawn()) {
				// ペンを下げた場所と同じ場所でペンを上げたら、パスを閉じる（始点と終点をつなげる）
				if (this._isInPenDownPoint()) this._ctx.closePath();
				this._drawActually();
			}
			this._pen = val;
			return this;
		}

		/**
		 * ペンを下ろした場所にいる？（ライブラリ内だけで使用）
		 * @private
		 * @return {boolean} ペンを下ろした場所にいるかどうか
		 */
		_isInPenDownPoint() {
			const x = this._x, y = this._y;
			const pdX = this._area.fromX, pdY = this._area.fromY;
			const sqLen = (x - pdX) * (x - pdX) + (y - pdY) * (y - pdY);
			return (sqLen < 0.01);
		}

		/**
		 * 実際に絵をかく（ライブラリ内だけで使用）
		 * @private
		 */
		_drawActually() {
			let ms = this._curMode;
			ms = ms.replace('fill', 'f');
			ms = ms.replace('stroke', 's');
			ms = ms.replace('clip', 'c');
			for (const m of ms) {
				switch (m) {
					case 'f':
						this._fill.draw(this._ctx, this._area);
						break;
					case 's':
						this._stroke.draw(this._ctx, this._area);
						break;
					case 'c':
						if (this._isClippable) this._ctx.clip();
						break;
				}
			}
		}

		/**
		 * かくモード
		 * @param {string=} val 値
		 * @return {string|TurtleBase} かくモード／このタートル・ベース
		 */
		mode(val) {
			if (val === undefined) return this._mode;
			this._mode = val;

			// ペンを下ろしていても、何も描いていないなら
			if (this._pen && this._isNotDrawn()) {
				this._curMode = this._mode.toLowerCase();
			}
			return this;
		}

		/**
		 * 何もかいていない？（ライブラリ内だけで使用）
		 * @private
		 * @return {boolean} 何もかいていないかどうか
		 */
		_isNotDrawn() {
			const a = this._area, x = this._x, y = this._y;
			if (a.fromX === x && a.left === x && a.right === x && a.fromY === y && a.top === y && a.bottom === y) {
				return true;
			}
			return false;
		}

		/**
		 * 線スタイル
		 * @param {Stroke=} opt_stroke 設定する線スタイル（オプション）
		 * @return {Stroke|TurtleBase} 線スタイル／このタートル・ベース
		 */
		stroke(opt_stroke) {
			if (opt_stroke === undefined) return this._stroke;
			this._stroke = new STYLE.Stroke(opt_stroke);
			return this;
		}

		/**
		 * ぬりスタイル
		 * @param {Fill=} opt_fill 設定するぬりスタイル（オプション）
		 * @return {Fill|TurtleBase} ぬりスタイル／このタートル・ベース
		 */
		fill(opt_fill) {
			if (opt_fill === undefined) return this._fill;
			this._fill = new STYLE.Fill(opt_fill);
			return this;
		}

		/**
		 * エッジ
		 * @param {function=} func エッジを決める関数
		 * @return {function|TurtleBase} エッジ／このタートル・ベース
		 */
		edge(func, ...fs) {
			if (func === undefined) return this._liner.edge();
			this._liner.edge(func, ...fs);
			return this;
		}


		// 紙操作 ------------------------------------------------------------------


		/**
		 * 紙
		 * @param {Paper|CanvasRenderingContext2D=} ctx 紙／キャンバス・コンテキスト
		 * @return {Paper|CanvasRenderingContext2D|Ruler} 紙／キャンバス・コンテキスト／この定規
		 */
		context(ctx) {
			if (ctx === undefined) return this._ctx;
			this._ctx = ctx;
			return this;
		}

		/**
		 * 紙をカメの場所と方向に合わせる
		 */
		localize() {
			this._ctx.translate(this._x, this._y);
			this._ctx.rotate(rad(this._dir));
		}

		/**
		 * 紙をカメの場所に合わせて拡大縮小する
		 * @param {number} rate 拡大縮小率
		 * @param {number=} opt_rateY たての拡大縮小率（オプション）
		 */
		scale(rate, opt_rateY = null) {
			this._ctx.translate(this._x, this._y);
			if (opt_rateY === null) {
				this._ctx.scale(rate, rate);
			} else {
				this._ctx.scale(rate, opt_rateY);
			}
			this._ctx.translate(-this._x, -this._y);
		}

	}


	/**
	 * タートル
	 * @version 2021-10-10
	 */
	class Turtle extends TurtleBase {

		/**
		 * カメを作る
		 * @constructor
		 * @param {Paper|CanvasRenderingContext2D} ctx 紙／キャンバス・コンテキスト
		 * @param {number=} normalDeg 標準の方向
		 */
		constructor(ctx, normalDeg) {
			super(ctx, normalDeg);

			this._visible      = false;
			this._isAnimating  = false;
			this._aniRemain    = 0;
			this._aniMax       = 0;
			this._aniFinished  = true;
			this._lastPenState = false;

			this._curLoc     = [0, 0, 0];
			this._curHomeLoc = [0, 0, 0];
			this._curAs      = [];
			this._curPen     = false;
			this._curTrans   = this._ctx.getTransform();
			this._curFnPos   = [null, null];
			this._curFn      = '';
			this._fn         = '';

			this._onPenChanged = null;
			this._onMoved      = null;
		}

		/**
		 * ペンが変わったイベントに対応する関数をセットする
		 * @param {function} handler 関数
		 * @return {function|Turtle} 関数かこのタートル
		 */
		onPenChanged(handler) {
			if (handler === undefined) return this._onPenChanged;
			this._onPenChanged = handler;
			return this;
		}

		/**
		 * 移動したイベントに対応する関数をセットする
		 * @param {function} handler 関数
		 * @return {function|Turtle} 関数かこのタートル
		 */
		onMoved(handler) {
			if (handler === undefined) return this._onMoved;
			this._onMoved = handler;
			return this;
		}


		// 場所か方向の変化 --------------------------------------------------------


		/**
		 * 前に進む
		 * @param {number} step 歩数
		 * @return {Turtle} このタートル
		 */
		go(step) {
			this._fn = 'go';
			return super.go(step);
		}

		/**
		 * 後ろに戻る
		 * @param {number} step 歩数
		 * @return {Turtle} このタートル
		 */
		back(step) {
			this._fn = 'bk';
			return super.back(step);
		}

		/**
		 * 実際に進む（ライブラリ内だけで使用）
		 * @private
		 * @param {number} step 歩数
		 * @param {number} limit 制限
		 * @return {number} 実際に動いた量
		 */
		_doGo(step, limit) {
			return super._doGo(step, limit, (x0, y0, dir_, d) => {
				if (!this._visible) return;
				const r = rad(dir_);
				const x = x0 + d * Math.cos(r);
				const y = y0 + d * Math.sin(r);
				const t = this._ctx.getTransform();
				this._curAs = [{ x0, y0, t }, { x, y, t }];
			});
		}

		/**
		 * 右に回る
		 * @param {number} deg 角度
		 * @return {Turtle} このタートル
		 */
		turnRight(deg) {
			this._fn = 'tr';
			return super.turnRight(deg);
		}

		/**
		 * 左に回る
		 * @param {number} deg 角度
		 * @return {Turtle} このタートル
		 */
		turnLeft(deg) {
			this._fn = 'tl';
			return super.turnLeft(deg);
		}

		/**
		 * 実際に方向を変える（ライブラリ内だけで使用）
		 * @private
		 * @param {number} deg 角度
		 * @param {number} limit 制限
		 * @return {number} 実際に動いた量
		 */
		_doTurn(deg, limit) {
			return super._doTurn(deg, limit, (bx, by) => {
				if (!this._visible) return;
				const dir_ = this._dir - 90;
				const r0 = rad(dir_), r1 = rad(dir_ + deg);
				const t = this._ctx.getTransform();
				this._curAs = [{ bx, by, r0, r1, t }];
			});
		}


		// 場所と方向の変化 --------------------------------------------------------


		/**
		 * 右にカーブする
		 * @param {number} step0 歩数1
		 * @param {number} deg 角度1
		 * @param {number} step1 歩数2
		 * @param {number=} opt_deg 角度2（オプション）
		 * @param {number=} opt_step 歩数3（オプション）
		 * @return {Turtle} このタートル
		 */
		curveRight(step0, deg, step1, opt_deg, opt_step) {
			this._fn = 'cr';
			return super.curveRight(step0, deg, step1, opt_deg, opt_step);
		}

		/**
		 * 左にカーブする
		 * @param {number} step0 歩数1
		 * @param {number} deg 角度1
		 * @param {number} step1 歩数2
		 * @param {number=} opt_deg 角度2（オプション）
		 * @param {number=} opt_step 歩数3（オプション）
		 * @return {Turtle} このタートル
		 */
		curveLeft(step0, deg, step1, opt_deg, opt_step) {
			this._fn = 'cl';
			return super.curveLeft(step0, deg, step1, opt_deg, opt_step);
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
			return super._doCurve(step0, deg, step1, opt_deg, opt_step, limit, (x, y, dir_, d0, deg, d1, opt_deg, d2) => {
				if (!this._visible) return;
				const r0 = rad(dir_), r1 = rad(dir_ + deg);
				const x1 = x + d0 * Math.cos(r0), y1 = y + d0 * Math.sin(r0);
				const x2 = x1 + d1 * Math.cos(r1), y2 = y1 + d1 * Math.sin(r1);

				const t = this._ctx.getTransform();
				if (opt_deg === undefined) {
					this._curAs = [{ x0: x, y0: y, t }, { tx: x1, ty: y1, t }, { x: x2, y: y2, t }];
				} else {
					const r2 = rad(dir_ + deg + opt_deg);
					const x3 = x2 + d2 * Math.cos(r2), y3 = y2 + d2 * Math.sin(r2);
					this._curAs = [{ x0: x, y0: y, t }, { tx: x1, ty: y1, t }, { tx: x2, ty: y2, t }, { x: x3, y: y3, t }];
				}
			});
		}

		/**
		 * 右に曲がる弧をかく
		 * @param {number|number[]} r 半径（配列なら横半径とたて半径）
		 * @param {number|number[]} deg 角度（配列なら開始角度と終了角度）
		 * @return {Turtle} このタートル
		 */
		arcRight(r, deg) {
			this._fn = 'ar';
			return super.arcRight(r, deg);
		}

		/**
		 * 左に曲がる弧をかく
		 * @param {number|number[]} r 半径（配列なら横半径とたて半径）
		 * @param {number|number[]} deg 角度（配列なら開始角度と終了角度）
		 * @return {Turtle} このタートル
		 */
		arcLeft(r, deg) {
			this._fn = 'al';
			return super.arcLeft(r, deg);
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
			return super._doArc(r, deg, isLeft, limit, (lsp, ltp, rot, p) => {
				if (this._visible) {
					const t = this._ctx.getTransform();
					this._curAs = [{ cx: lsp, cy: ltp, w: p.w, h: p.h, r: rot, t }];
				}
			});
		}


		// 図形の描画 --------------------------------------------------------------


		/**
		 * 点をかく
		 * @return {Turtle} このタートル
		 */
		dot() {
			this._fn = 'dot';
			return super.dot();
		}

		/**
		 * 円をかく
		 * @param {number|number[]} r 半径（配列なら横半径とたて半径）
		 * @param {number|number[]=} [deg=360] 弧の角度（配列なら開始角度と終了角度）
		 * @param {boolean=} [anticlockwise=false] 反時計回り？
		 * @return {Turtle} このタートル
		 */
		circle(r, deg = 360, anticlockwise = false) {
			this._fn = 'circle';
			return super.circle(r, deg, anticlockwise);
		}

		/**
		 * 実際に円をかく（ライブラリ内だけで使用）
		 * @private
		 * @param {number} cx 中心のx座標
		 * @param {number} cy 中心のy座標
		 * @param {dict} p パラメター
		 * @param {boolean} anticlockwise 反時計回り？
		 * @param {number} limit 制限
		 * @param {number} dr 方向
		 * @return {number} 実際に動いた量
		 */
		_doCircle(cx, cy, p, anticlockwise, limit, dr) {
			return super._doCircle(cx, cy, p, anticlockwise, limit, dr, (cx, cy, p, dr) => {
				if (this._visible) {
					const t = this._ctx.getTransform();
					this._curAs = [{ cx: cx, cy: cy, w: p.w, h: p.h, r: dr, t }];
				}
			});
		}


		// アニメーション ----------------------------------------------------------


		/**
		 * アニメーションを表示する？
		 * @param {boolean} val 値
		 * @return {boolean|Turtle} アニメーションを表示する？／このタートル
		 */
		visible(val) {
			if (val === undefined) return this._visible;
			this._visible = val;
			return this;
		}

		/**
		 * アニメーションを次に進める
		 * @param {number} num フレーム数
		 */
		stepNext(num) {
			if (this._isAnimating) {
				// アニメ終わり
				if (this._aniFinished) {
					this._isAnimating = false;
					// 保存してあったアニメ開始時点を捨てる
					this._stack.pop();
				} else {
					this._drawTurtle(this._ctx);
					// アニメ開始時点に戻す
					this.restore().save();
					this._aniMax += num;
				}
			} else {
				// アニメ始まり
				if (!this._aniFinished) {
					this._isAnimating = true;
					// アニメ開始時点を保存する
					this.save();
				}
			}
			this._aniRemain = this._aniMax;
			this._aniFinished = true;
			this._isClippable = true;
		}

		/**
		 * アニメーションを最初に戻す
		 */
		resetAnimation() {
			if (this._isAnimating) {
				this._isAnimating = false;
				// 保存してあったアニメ開始時点を捨てる
				this._stack.pop();
			}
			this._aniMax = 0;
		}

		/**
		 * アニメーションのスキップをチェックする（ライブラリ内だけで使用）
		 * @private
		 * @return {number} 残りのパワー
		 */
		_getPower() {
			// アニメーション表示でなかったらnullを返す
			if (!this._visible) return null;

			if (this._aniRemain <= 0) {
				this._aniFinished = false;
				this._isClippable = false;
				return 0;
			}
			return this._aniRemain;
		}

		/**
		 * アニメーションの終わりをチェックする（ライブラリ内だけで使用）
		 * @private
		 * @param {number} consumption 消費パワー
		 */
		_usePower(consumption) {
			if (!this._visible) return;

			this._aniRemain -= consumption;
			if (this._aniRemain <= 0) {
				const p = this._pen;
				this.penUp();

				// penUpの後の必要あり
				this._aniFinished = false;
				this._isClippable = false;

				// カメをかくための情報を保存しておく
				this._curLoc     = [this._x, this._y, this._dir];
				this._curHomeLoc = [this._homeX, this._homeY, this._homeDir];
				this._curPen     = p;
				this._curTrans   = this._ctx.getTransform();
				this._curFn      = this._fn;

				if (this._onPenChanged !== null && this._lastPenState !== p) this._onPenChanged(this, p);
				if (this._onMoved !== null) this._onMoved(this, this._x, this._y, p);
				this._lastPenState = p;
			}
		}

		/**
		 * カメ（ホーム）をかく（ライブラリ内だけで使用）
		 * @private
		 * @param {Paper|CanvasRenderingContext2D} ctx 紙／キャンバス・コンテキスト
		 */
		_drawTurtle(ctx) {
			ctx.save();
			ctx.setLineDash([]);
			ctx.globalAlpha = 1;

			ctx.setTransform(1, 0, 0, 1, 0, 0);
			this._drawAnchor(ctx, this._curAs);

			let [hx, hy, hd] = this._curHomeLoc;
			// ホームの場所が変えられていたら
			if (hx !== 0 || hy !== 0 || hd !== 0) {
				if (this._curTrans) [hx, hy] = transform(this._curTrans, hx, hy);
				this._drawTriangle(ctx, [hx, hy, hd], true, 'Purple', '', 'Magenta');
			}
			let [x, y, d] = this._curLoc;
			if (this._curTrans) [x, y] = transform(this._curTrans, x, y);
			this._drawTriangle(ctx, [x, y, d], this._curPen, 'SeaGreen', 'DarkSeaGreen', 'Lime');
			this._drawFunction(ctx, [x, y], this._curFnPos, this._curFn);

			ctx.restore();
			this._curFn = '';
			this._curAs = [];
		}

		/**
		 * カメやホームを表す三角をかく（ライブラリ内だけで使用）
		 * @private
		 * @param {Paper|CanvasRenderingContext2D} ctx 紙／キャンバス・コンテキスト
		 * @param {*} loc 場所
		 * @param {*} pen ペンの状態
		 * @param {*} downColor ペンを下げているときの色
		 * @param {*} upColor ペンを上げているときの色
		 * @param {*} lineColor 線の色
		 */
		_drawTriangle(ctx, loc, pen, downColor, upColor, lineColor) {
			ctx.save();
			ctx.translate(loc[0], loc[1]);
			ctx.rotate(rad(loc[2]));

			ctx.beginPath();
			ctx.moveTo(0, -10);
			ctx.lineTo(8, 8);
			ctx.lineTo(-8, 8);
			ctx.closePath();

			ctx.fillStyle = pen ? downColor : upColor;
			Turtle._setShadow(ctx, pen ? 4 : 6, 4);
			ctx.fill();

			Turtle._setShadow(ctx, 0, 0);
			ctx.lineWidth = 2;
			ctx.strokeStyle = lineColor;
			ctx.stroke();
			ctx.restore();
		}

		/**
		 * カメの実行中の動きをかく（ライブラリ内だけで使用）
		 * @private
		 * @param {Paper|CanvasRenderingContext2D} ctx 紙／キャンバス・コンテキスト
		 * @param {number[]} loc 場所
		 * @param {number[]} fnPos 関数をかく場所
		 * @param {string} curFn 現在の関数
		 */
		_drawFunction(ctx, loc, fnPos, curFn) {
			ctx.save();
			const offX = loc[0] <= 0 ? 48 : -48;
			const offY = loc[1] <= 0 ? 48 : -48;
			if (fnPos[0] === null || fnPos[1] === null) {
				fnPos[0] = loc[0] + offX;
				fnPos[1] = loc[1] + offY;
			} else {
				fnPos[0] = fnPos[0] * 0.95 + (loc[0] + offX) * 0.05;
				fnPos[1] = fnPos[1] * 0.95 + (loc[1] + offY) * 0.05;
			}

			ctx.fillStyle = 'black';
			ctx.strokeStyle = 'white';
			ctx.lineWidth = 3;
			ctx.font = 'bold 26px Consolas, Menlo, "Courier New", Meiryo, monospace';
			ctx.textAlign = 'center';
			ctx.translate(fnPos[0], fnPos[1]);
			Turtle._setShadow(ctx, 4, 2);
			ctx.strokeText(curFn, 0, 12);
			Turtle._setShadow(ctx, 0, 0);
			ctx.fillText(curFn, 0, 12);
			ctx.restore();
		}

		/**
		 * カメのアンカーをかく（ライブラリ内だけで使用）
		 * @private
		 * @param {Paper|CanvasRenderingContext2D} ctx 紙／キャンバス・コンテキスト
		 * @param {Array} curPos 場所
		 */
		_drawAnchor(ctx, curPos) {
			for (const p of curPos) {
				if (p.x0 !== undefined) {
					draw(p.t, p.x0, p.y0, 'Lime', 'DarkSeaGreen', drawCheck);
				} else if (p.x !== undefined) {
					draw(p.t, p.x, p.y, 'Lime', 'SeaGreen', drawCheck);
				} else if (p.tx !== undefined) {
					draw(p.t, p.tx, p.ty, 'Magenta', 'Purple', drawCheck);
				} else if (p.cx !== undefined) {
					draw(p.t, p.cx, p.cy, 'Magenta', 'Purple', drawCheck);
					draw(p.t, p.cx, p.cy, 'Magenta', 'Purple', drawRect, p.r, p.w, p.h);
				} else if (p.bx !== undefined) {
					draw(p.t, p.bx, p.by, 'Magenta', 'DarkPurple', drawLine, p.r0);
					draw(p.t, p.bx, p.by, 'Magenta', 'Purple', drawLine, p.r1);
				}
			}
			function draw(t, x, y, outer, inner, fn, ...args) {
				ctx.save();
				ctx.strokeStyle = outer;
				ctx.lineWidth = 4;
				Turtle._setShadow(ctx, 4, 2);
				fn(t, x, y, ...args);
				ctx.restore();

				ctx.save();
				ctx.strokeStyle = inner;
				ctx.lineWidth = 2;
				Turtle._setShadow(ctx, 0, 0);
				fn(t, x, y, ...args);
				ctx.restore();
			}
			function drawCheck(t, x, y) {
				const [x1, y1] = transform(t, x, y);
				ctx.translate(x1, y1);

				ctx.beginPath();
				ctx.moveTo(-8, -8);
				ctx.lineTo( 8,  8);
				ctx.moveTo( 8, -8);
				ctx.lineTo(-8,  8);
				ctx.stroke();
			}
			function drawRect(t, x, y, r, hw, hh) {
				const [hw1, hh1] = rotate(r,  hw, hh);
				const [hw2, hh2] = rotate(r, -hw, hh);
				const [x1, y1] = transform(t, x - hw1, y - hh1);
				const [x2, y2] = transform(t, x - hw2, y - hh2);
				const [x3, y3] = transform(t, x + hw1, y + hh1);
				const [x4, y4] = transform(t, x + hw2, y + hh2);

				ctx.setLineDash([6, 4]);
				ctx.beginPath();
				ctx.moveTo(x1, y1);
				ctx.lineTo(x2, y2);
				ctx.lineTo(x3, y3);
				ctx.lineTo(x4, y4);
				ctx.closePath();
				ctx.stroke();
			}
			function drawLine(t, x, y, r) {
				const [lx, ly] = rotate(r, 128, 0);
				const [x1, y1] = transform(t, x, y);
				const [x2, y2] = transform(t, x + lx, y + ly);

				ctx.setLineDash([6, 4]);
				ctx.beginPath();
				ctx.moveTo(x1, y1);
				ctx.lineTo(x2, y2);
				ctx.stroke();
			}
		}

		/**
		 * 影をセットする（ライブラリ内だけで使用）
		 * @private
		 * @param {Paper|CanvasRenderingContext2D} ctx 紙／キャンバス・コンテキスト
		 * @param {number} blur ぼかし量
		 * @param {number} off 影のずれ
		 * @param {string} [color='rgba(0,0,0,0.5)'] 色
		 */
		static _setShadow(ctx, blur, off, color = 'rgba(0,0,0,0.5)') {
			ctx.shadowBlur = blur;
			ctx.shadowOffsetX = ctx.shadowOffsetY = off;
			ctx.shadowColor = color;
		}

	}


	// ユーティリティ関数 ------------------------------------------------------


	/**
	 * タートルを使ってかく関数からスタンプ（高速に絵をかく関数）を作る
	 * @param {number} width スタンプの横幅
	 * @param {number} height スタンプのたて幅
	 * @param {number} cx スタンプの中心x座標
	 * @param {number} cy スタンプの中心y座標
	 * @param {number} scale 拡大率
	 * @param {function} func 関数
	 * @return {function} スタンプの関数
	 */
	const makeStamp = function (width, height, cx, cy, scale, func) {
		let curArgs = null, cacheCtx = null, cacheT = null;

		function isSame(a0, a1) {
			if (a0.length !== a1.length) return false;
			for (let i = 0, I = a0.length; i < I; i += 1) {
				if (a0[i] !== a1[i]) return false;
			}
			return true;
		}
		return function (t, ...var_args) {
			if (!cacheCtx) {
				cacheCtx = new CROQUJS.Paper(width, height, false);
				cacheCtx.translate(cx, cy);
				t.context().addChild(cacheCtx);
				cacheT = new TURTLE.Turtle(cacheCtx);
			}
			if (!curArgs || !isSame(curArgs, var_args)) {
				cacheCtx.clear();
				var_args.unshift(cacheT);  // cacheTを挿入
				func(...var_args);
				curArgs = var_args.slice(1);  // cacheTを削除
			}
			t.image(cacheCtx, cx, cy, scale);
		};
	};


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
		penDown       : ['pd', 'down'],
		penUp         : ['pu', 'up'],
		context       : ['paper'],
	};

	// 関数の別名を登録する
	for (const target of [Turtle, TurtleBase]) {
		for (const [orig, as] of Object.entries(aliasMap)) {
			for (const a of as) {
				target.prototype[a] = target.prototype[orig];
			}
		}
	}

	return { Turtle, TurtleBase, makeStamp };

}());
