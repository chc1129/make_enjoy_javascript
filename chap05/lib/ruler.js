/**
 * 定規ライブラリ（RULER）
 *
 * @author Takuto Yanagida
 * @version 2021-02-04
 */


/**
 * ライブラリ変数
 */
const RULER = (function () {

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
	 * ラジアンを角度にする
	 * @param {number} rad ラジアン
	 * @return {number} 角度
	 */
	const deg = function (rad) {
		return rad * 180.0 / Math.PI;
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
	 * 定規
	 * @version 2021-05-21
	 */
	class Ruler {

		/**
		 * 定規を作る
		 * @constructor
		 * @param {Paper|CanvasRenderingContext2D} ctx 紙／キャンバス・コンテキスト
		 */
		constructor(ctx) {
			if (typeof STYLE === 'undefined') throw new Error('Styleライブラリが必要です。');
			if (typeof PATH === 'undefined') throw new Error('Pathライブラリが必要です。');

			this._x = 0;
			this._y = 0;
			this._beginX = 0;
			this._beginY = 0;
			this._toBeResetArea = true;
			this._hasPath = false;

			this._ctx = ctx;
			this._stack = [];

			this._liner = new PATH.Liner({
				lineOrMoveTo: (x, y, dir) => {
					this._ctx.lineTo(x, y);
					this._x = x;
					this._y = y;
				},
				quadCurveOrMoveTo: (x1, y1, x2, y2, dir) => {
					this._ctx.quadraticCurveTo(x1, y1, x2, y2);
					this._x = x2;
					this._y = y2;
				},
				bezierCurveOrMoveTo: (x1, y1, x2, y2, x3, y3, dir) => {
					this._ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3);
					this._x = x3;
					this._y = y3;
				},
				arcOrMoveTo: (cx, cy, dr, w, h, r0, r1, ac, dir, xx, yy) => {
					PATH.eclipse(this._ctx, cx, cy, w, h, dr, r0, r1, ac);
					this._x = xx;
					this._y = yy;
				}
			});
			this._area = { fromX: null, toX: null, left: null, right: null, fromY: null, toY: null, top: null, bottom: null, sqLen: null };
			this._stroke = new STYLE.Stroke();
			this._fill = new STYLE.Fill();
			this._edge = null;
		}

		/**
		 * エリアをリセットする
		 * @private
		 * @param {number} x x座標（横の場所）
		 * @param {number} y y座標（たての場所）
		 */
		_resetArea(x, y) {
			this._area.fromX = this._area.left = this._area.right = x;
			this._area.fromY = this._area.top = this._area.bottom = y;
			this._area.sqLen = 0;
			this._toBeResetArea = false;
			this._beginX = x;
			this._beginY = y;
		}

		/**
		 * 今の状態を保存する
		 * @param {boolean=} [opt_savePaper=false] 紙の状態も保存するか？
		 * @return {Ruler} この定規
		 */
		save(opt_savePaper = false) {
			if (opt_savePaper === true) this._ctx.save();
			this._stack.push(this._getState());
			return this;
		}

		/**
		 * 前の状態を復元する
		 * @param {boolean=} [opt_restorePaper=false] 紙の状態も復元するか？
		 * @return {Ruler} この定規
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
				this._x, this._y,  // 以下、順番に依存関係あり
				this._beginX, this._beginY = 0,
				this._toBeResetArea, this._hasPath,
				Object.assign({}, this._area),
				new STYLE.Stroke(this._stroke),
				new STYLE.Fill(this._fill),
				this._liner.edge(),
			];
		}

		/**
		 * 状態を設定する（ライブラリ内だけで使用）
		 * @private
		 * @param {Array} t 状態
		 */
		_setState(t) {
			this._x = t[0]; this._y = t[1];
			this._beginX = t[2]; this._beginY = t[3];
			this._toBeResetArea = t[4]; this._hasPath = t[5];
			this._area = t[6];
			this._stroke = t[7];
			this._fill = t[8];
			this._liner.edge(t[9]);
		}


		// 描画状態の変化 ----------------------------------------------------------


		/**
		 * 線スタイル
		 * @param {Stroke=} opt_stroke 設定する線スタイル（オプション）
		 * @return {Stroke|Ruler} 線スタイル／この定規
		 */
		stroke(opt_stroke) {
			if (opt_stroke === undefined) return this._stroke;
			this._stroke = new STYLE.Stroke(opt_stroke);
			return this;
		}

		/**
		 * ぬりスタイル
		 * @param {Fill=} opt_fill 設定するぬりスタイル（オプション）
		 * @return {Fill|Ruler} ぬりスタイル／この定規
		 */
		fill(opt_fill) {
			if (opt_fill === undefined) return this._fill;
			this._fill = new STYLE.Fill(opt_fill);
			return this;
		}

		/**
		 * エッジ
		 * @param {function=} func エッジを決める関数
		 * @return {function|Ruler} エッジ／この定規
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


		// 図形の描画 --------------------------------------------------------------


		/**
		 * パスを始める
		 * @return {Ruler} この定規
		 */
		beginPath() {
			this._ctx.beginPath();
			this._toBeResetArea = true;
			this._hasPath = false;
			return this;
		}

		/**
		 * パスを閉じる
		 * @return {Ruler} この定規
		 */
		closePath() {
			this.lineTo(this._beginX, this._beginY);
			return this;
		}

		/**
		 * 移動する
		 * @param {number} x x座標
		 * @param {number} y y座標
		 * @return {Ruler} この定規
		 */
		moveTo(x, y) {
			this._ctx.moveTo(x, y);
			this._x = x;
			this._y = y;
			this._hasPath = true;
			return this;
		}

		/**
		 * 線分をかく
		 * @param {number} x1 終点x座標
		 * @param {number} y1 終点y座標
		 * @return {Ruler} この定規
		 */
		lineTo(x1, y1) {
			if (!this._hasPath) {
				return this.moveTo(x1, y1);
			}
			const { _x: x0, _y: y0 } = this;
			if (this._toBeResetArea) this._resetArea(x0, y0);
			this._liner.lineAbs(x0, y0, x1, y1, null, this._area);
			return this;
		}

		/**
		 * 二次ベジェ曲線をかく
		 * @param {number} x1 ハンドルx座標
		 * @param {number} y1 ハンドルy座標
		 * @param {number} x2 終点x座標
		 * @param {number} y2 終点y座標
		 * @return {Ruler} この定規
		 */
		quadraticCurveTo(x1, y1, x2, y2) {
			if (!this._hasPath) this.moveTo(x1, y1);
			const { _x: x0, _y: y0 } = this;
			if (this._toBeResetArea) this._resetArea(x0, y0);
			this._liner.quadCurveAbs(x0, y0, x1, y1, x2, y2, null, this._area);
			return this;
		}

		/**
		 * 三次ベジェ曲線をかく
		 * @param {*} x1 ハンドル1x座標
		 * @param {*} y1 ハンドル1y座標
		 * @param {*} x2 ハンドル2x座標
		 * @param {*} y2 ハンドル2y座標
		 * @param {*} x3 終点x座標
		 * @param {*} y3 終点y座標
		 * @return {Ruler} この定規
		 */
		bezierCurveTo(x1, y1, x2, y2, x3, y3) {
			if (!this._hasPath) this.moveTo(x1, y1);
			const { _x: x0, _y: y0 } = this;
			if (this._toBeResetArea) this._resetArea(x0, y0);
			this._liner.bezierCurveAbs(x0, y0, x1, y1, x2, y2, x3, y3, null, this._area);
			return this;
		}

		/**
		 * 円弧をかく
		 * @param {number} cx 中心x座標
		 * @param {number} cy 中心y座標
		 * @param {number} radius 半径
		 * @param {number} startAngle 開始角度
		 * @param {number} endAngle 終了角度
		 * @param {boolean=} [anticlockwise=false] 反時計回り？
		 * @return {Ruler} この定規
		 */
		arc(cx, cy, radius, startAngle, endAngle, anticlockwise = false) {
			const x0 = cx + radius * Math.cos(rad(startAngle));
			const y0 = cy + radius * Math.sin(rad(startAngle));
			if (!this._hasPath) {
				this.moveTo(x0, y0);
			} else {
				this.lineTo(x0, y0);
			}
			if (this._toBeResetArea) this._resetArea(x0, y0);
			this._liner.arc(cx, cy, 0, radius, radius, startAngle, endAngle, anticlockwise, null, this._area);
			return this;
		}

		arcTo() {
		}

		/**
		 * 円をかく
		 * @param {number} x 中心x座標
		 * @param {number} y 中心y座標
		 * @param {number} radiusX 横半径
		 * @param {number} radiusY たて半径
		 * @param {number} rotation 回転
		 * @param {number} startAngle 開始角度
		 * @param {number} endAngle 終了角度
		 * @param {boolean=} [anticlockwise=false] 反時計回り？
		 * @return {Ruler} この定規
		 */
		ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise = false) {
			const s0 = radiusX * Math.cos(rad(startAngle)), t0 = radiusY * Math.sin(rad(startAngle));
			const sin = Math.sin(rad(rotation)), cos = Math.cos(rad(rotation));
			const x0 = x + s0 * cos - t0 * sin;
			const y0 = y + s0 * sin + t0 * cos;
			if (!this._hasPath) {
				this.moveTo(x0, y0);
			} else {
				this.lineTo(x0, y0);
			}
			if (this._toBeResetArea) this._resetArea(x0, y0);
			this._liner.arc(x, y, rotation, radiusX, radiusY, startAngle, endAngle, anticlockwise, null, this._area);
			return this;
		}

		/**
		 * 四角形をかく
		 * @param {number} x x座標
		 * @param {number} y y座標
		 * @param {number} width 横幅
		 * @param {number} height たて幅
		 * @return {Ruler} この定規
		 */
		rect(x, y, width, height) {
			this._resetArea(x, y);
			this._ctx.beginPath();

			this._ctx.moveTo(x, y);
			this._liner.line(x, y, 0, width, null, this._area);
			this._liner.line(x + width, y, 90, height, null, this._area);
			this._liner.line(x + width, y + height, 180, width, null, this._area);
			this._liner.line(x, y + height, -90, height, null, this._area);
			return this;
		}

		/**
		 * 実際にかく
		 * @param {string} mode モード
		 * @return {Ruler} この定規
		 */
		draw(mode) {
			let ms = mode;
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
						this._ctx.clip();
						break;
				}
			}
			return this;
		}


		// 直接描画関数 ------------------------------------------------------------


		/**
		 * 円をかく
		 * @param {number} cx 中心x座標
		 * @param {number} cy 中心y座標
		 * @param {number|number[]} r 半径（配列なら横半径とたて半径）
		 * @param {number=} [opt_dir=0] 方向
		 * @param {number|number[]=} [opt_deg=360] 角度（配列なら開始角度と終了角度）
		 * @param {boolean=} [opt_anticlockwise=false] 反時計回り？
		 * @return {Ruler} この定規
		 */
		circle(cx, cy, r, opt_dir = 0, opt_deg = 360, opt_anticlockwise = false) {
			const p = PATH.arrangeArcParams(r, opt_deg, 1);

			const r0 = rad(p.deg0), s0 = p.w * Math.cos(r0), t0 = p.h * Math.sin(r0);
			const dr = rad(opt_dir), sin = Math.sin(dr), cos = Math.cos(dr);
			const sp = s0 * cos - t0 * sin, tp = s0 * sin + t0 * cos;

			this._resetArea(cx + sp, cy + tp);
			this._ctx.beginPath();

			this._ctx.moveTo(cx + sp, cy + tp);
			this._liner.arc(cx, cy, opt_dir, p.w, p.h, p.deg0, p.deg1, opt_anticlockwise, null, this._area);
			return this;
		};

		/**
		 * 線をかく
		 * @param {number} fromX 始点x座標
		 * @param {number} fromY 始点y座標
		 * @param {number} toX 終点x座標
		 * @param {number} toY 終点y座標
		 * @return {Ruler} この定規
		 */
		line(fromX, fromY, toX, toY) {
			const dr = Math.atan2(toY - fromY, toX - fromX);
			const dest = Math.sqrt((toX - fromX) * (toX - fromX) + (toY - fromY) * (toY - fromY));

			this._resetArea(fromX, fromY);
			this._ctx.beginPath();

			this._ctx.moveTo(fromX, fromY);
			this._liner.line(fromX, fromY, deg(dr), dest, null, this._area);
			return this;
		};

		/**
		 * 点をかく
		 * @param {number} x x座標
		 * @param {number} y y座標
		 * @return {Ruler} この定規
		 */
		dot(x, y) {
			this._ctx.beginPath();
			this._ctx.rect(x, y, 1, 1);
			return this;
		}

	}


	// ライブラリを作る --------------------------------------------------------


	// 関数の別名
	const aliasMap = {
		context: ['paper'],
	};

	// 関数の別名を登録する
	for (const [orig, as] of Object.entries(aliasMap)) {
		for (const a of as) {
			Ruler.prototype[a] = Ruler.prototype[orig];
		}
	}

	return { Ruler };

}());
