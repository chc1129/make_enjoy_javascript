/**
 * パス・ライブラリ（PATH）
 *
 * 図形のパスを作るためのライブラリです。
 *
 * @author Takuto Yanagida
 * @version 2021-05-21
 */


/**
 * ライブラリ変数
 */
const PATH = (function () {

	'use strict';


	// ライブラリ中だけで使用するユーティリティ --------------------------------


	/**
	 * 最小値
	 */
	const E = 0.0000000000001;

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
	 * 2点間の角度を求める
	 * @param {number} x0 点1のx座標
	 * @param {number} y0 点1のy座標
	 * @param {number} x1 点2のx座標
	 * @param {number} y1 点2のy座標
	 * @return {number} 角度
	 */
	const degOf = function (x0, y0, x1, y1) {
		let d = (Math.atan2(y1 - y0, x1 - x0) * 180.0 / Math.PI);
		while (d < 0) d += 360;
		while (360 <= d) d -= 360;
		return d;
	};

	/**
	 * 2点間の長さを求める
	 * @param {number} x0 点1のx座標
	 * @param {number} y0 点1のy座標
	 * @param {number} x1 点2のx座標
	 * @param {number} y1 点2のy座標
	 * @return {number} 長さ
	 */
	const lenOf = function (x0, y0, x1, y1) {
		return Math.sqrt((x0 - x1) * (x0 - x1) + (y0 - y1) * (y0 - y1));
	};

	/**
	 * 長さを求める
	 * @param {number} x0 始点x座標
	 * @param {number} y0 始点y座標
	 * @param {function(number, number, number[]):void} func 関数
	 * @param {number} I 計算する細かさ
	 * @param {number=} [opt_limit=null] 長さ制限
	 * @param {object=} [opt_retArea=null] エリアを返す配列
	 * @return {object} 長さ
	 */
	const calcSpan = function (x0, y0, func, I, opt_limit = null, opt_retArea = null) {
		let px = x0, py = y0, pt = [], span = 0, limitedSpan = null, paramT, checkLimit;

		if (opt_limit !== null) checkLimit = true;

		for (let i = 1; i <= I; i += 1) {
			const t = i / I, tp = 1 - t;
			func(t, tp, pt);
			const x = pt[0], y = pt[1];

			if (opt_retArea !== null) updateArea(opt_retArea, x, y);
			span += Math.sqrt((x - px) * (x - px) + (y - py) * (y - py));
			px = x;
			py = y;

			if (checkLimit && opt_limit <= span) {
				limitedSpan = span;
				paramT = t;
				checkLimit = false;
			}
		}
		if (checkLimit) {
			limitedSpan = span;
			paramT = 1;
		}
		if (limitedSpan === null) limitedSpan = span;
		return { span, limitedSpan, paramT };
	};

	/**
	 * エリアの情報を更新する
	 * @param {object} area エリア情報
	 * @param {number} x x座標
	 * @param {number} y y座標
	 */
	const updateArea = function (area, x, y) {
		const fX = area.fromX, fY = area.fromY;
		const sqLen = (x - fX) * (x - fX) + (y - fY) * (y - fY);
		if (area.sqLen < sqLen) {
			area.sqLen = sqLen;
			area.toX = x;
			area.toY = y;
		}
		if (x < area.left)   area.left = x;
		if (y < area.top)    area.top = y;
		if (area.right < x)  area.right = x;
		if (area.bottom < y) area.bottom = y;
	};

	/**
	 * 線分の長さを求める
	 * @param {number} x0 始点x座標
	 * @param {number} y0 始点y座標
	 * @param {number} x1 終点x座標
	 * @param {number} y1 終点y座標
	 * @param {number} I 計算する細かさ
	 * @param {number=} [opt_limit=null] 長さ制限
	 * @param {object=} [opt_retArea=null] エリアを返す配列
	 * @return {object} 長さ
	 */
	const _lineLen = function (x0, y0, x1, y1, I, opt_limit = null, opt_retArea = null) {
		return calcSpan(x0, y0, function (t, tp, pt) {
			pt[0] = tp * x0 + t * x1;
			pt[1] = tp * y0 + t * y1;
		}, I, opt_limit, opt_retArea);
	};

	/**
	 * 二次ベジェ曲線の長さを求める
	 * @param {number} x0 始点x座標
	 * @param {number} y0 始点y座標
	 * @param {number} x1 ハンドルx座標
	 * @param {number} y1 ハンドルy座標
	 * @param {number} x2 終点x座標
	 * @param {number} y2 終点y座標
	 * @param {number} I 計算する細かさ
	 * @param {number=} [opt_limit=null] 長さ制限
	 * @param {object=} [opt_retArea=null] エリアを返す配列
	 * @return {object} 長さ
	 */
	const _quadLen = function (x0, y0, x1, y1, x2, y2, I, opt_limit = null, opt_retArea = null) {
		return calcSpan(x0, y0, function (t, tp, pt) {
			const k0 = tp * tp, k1 = 2 * t * tp, k2 = t * t;
			pt[0] = k0 * x0 + k1 * x1 + k2 * x2;
			pt[1] = k0 * y0 + k1 * y1 + k2 * y2;
		}, I, opt_limit, opt_retArea);
	};

	/**
	 * 三次ベジェ曲線の長さを求める
	 * @param {number} x0 始点x座標
	 * @param {number} y0 始点y座標
	 * @param {number} x1 ハンドル1x座標
	 * @param {number} y1 ハンドル1y座標
	 * @param {number} x2 ハンドル2x座標
	 * @param {number} y2 ハンドル2y座標
	 * @param {number} x3 終点x座標
	 * @param {number} y3 終点y座標
	 * @param {number} I 計算する細かさ
	 * @param {number=} [opt_limit=null] 長さ制限
	 * @param {object=} [opt_retArea=null] エリアを返す配列
	 * @return {object} 長さ
	 */
	const _bezierLen = function (x0, y0, x1, y1, x2, y2, x3, y3, I, opt_limit = null, opt_retArea = null) {
		return calcSpan(x0, y0, function (t, tp, pt) {
			const k0 = tp * tp * tp, k1 = 3 * t * tp * tp;
			const k2 = 3 * t * t * tp, k3 = t * t * t;
			pt[0] = k0 * x0 + k1 * x1 + k2 * x2 + k3 * x3;
			pt[1] = k0 * y0 + k1 * y1 + k2 * y2 + k3 * y3;
		}, I, opt_limit, opt_retArea);
	};

	/**
	 * 円弧の長さを求める
	 * - r0 < r1 なら時計回り、r1 < r0 なら反時計回り
	 * @param {number} cx 中心x座標
	 * @param {number} cy 中心y座標
	 * @param {number} dr 方向
	 * @param {number} w 横半径
	 * @param {number} h たて半径
	 * @param {number} r0 開始角度
	 * @param {number} r1 終了角度
	 * @param {number} I 計算する細かさ
	 * @param {number=} [opt_limit=null] 長さ制限
	 * @param {object=} [opt_retArea=null] エリアを返す配列
	 * @return {object} 長さ
	 */
	const _arcLen = function (cx, cy, dr, w, h, r0, r1, I, opt_limit = null, opt_retArea = null) {
		const s0 = w * Math.cos(r0), t0 = h * Math.sin(r0);
		const sin = Math.sin(dr), cos = Math.cos(dr);
		const x0 = cx + s0 * cos - t0 * sin;
		const y0 = cy + s0 * sin + t0 * cos;

		return calcSpan(x0, y0, function (t, tp, pt) {
			const r = tp * r0 + t * r1;
			const st = w * Math.cos(r), tt = h * Math.sin(r);
			pt[0] = cx + st * cos - tt * sin;
			pt[1] = cy + st * sin + tt * cos;
		}, I, opt_limit, opt_retArea);
	};

	/**
	 * 線分の中間点の座標を求める
	 * @private
	 * @param {number} t 媒介変数
	 * @param {number} x0 点1のx座標
	 * @param {number} y0 点1のy座標
	 * @param {number} x1 点2のx座標
	 * @param {number} y1 点2のy座標
	 * @return {number[]} 座標
	 */
	const _linePoints = function (t, x0, y0, x1, y1) {
		const tp = 1 - t;
		const x1p = tp * x0 + t * x1, y1p = tp * y0 + t * y1;
		return [x1p, y1p];
	};

	/**
	 * 二次ベジェ曲線の中間点の座標を求める
	 * @private
	 * @param {number} t 媒介変数
	 * @param {number} x0 点1のx座標
	 * @param {number} y0 点1のy座標
	 * @param {number} x1 点2のx座標
	 * @param {number} y1 点2のy座標
	 * @param {number} x2 点3のx座標
	 * @param {number} y2 点3のy座標
	 * @return {number[]} 座標
	 */
	const _quadPoints = function (t, x0, y0, x1, y1, x2, y2) {
		const tp = 1 - t;
		const k0 = tp * tp, k1 = 2 * t * tp, k2 = t * t;
		const x1p = tp * x0 + t * x1, y1p = tp * y0 + t * y1;
		const x2p = k0 * x0 + k1 * x1 + k2 * x2, y2p = k0 * y0 + k1 * y1 + k2 * y2;
		return [x1p, y1p, x2p, y2p];
	};

	/**
	 * 三次ベジェ曲線の中間点の座標を求める
	 * @private
	 * @param {number} t 媒介変数
	 * @param {number} x0 点1のx座標
	 * @param {number} y0 点1のy座標
	 * @param {number} x1 点2のx座標
	 * @param {number} y1 点2のy座標
	 * @param {number} x2 点3のx座標
	 * @param {number} y2 点3のy座標
	 * @param {number} x3 点4のx座標
	 * @param {number} y3 点4のy座標
	 * @return {number[]} 座標
	 */
	const _bezierPoints = function (t, x0, y0, x1, y1, x2, y2, x3, y3) {
		const tp = 1 - t;
		const k0 = tp * tp, k1 = 2 * t * tp, k2 = t * t;
		const k3 = tp * tp * tp, k4 = 3 * t * tp * tp;
		const k5 = 3 * t * t * tp, k6 = t * t * t;
		const x1p = tp * x0 + t * x1,                      y1p = tp * y0 + t * y1;
		const x2p = k0 * x0 + k1 * x1 + k2 * x2,           y2p = k0 * y0 + k1 * y1 + k2 * y2;
		const x3p = k3 * x0 + k4 * x1 + k5 * x2 + k6 * x3, y3p = k3 * y0 + k4 * y1 + k5 * y2 + k6 * y3;
		return [x1p, y1p, x2p, y2p, x3p, y3p];
	};


	/**
	 * ライナー
	 * @version 2021-02-12
	 */
	class Liner {

		/**
		 * ライナーを作る
		 * @constructor
		 * @param {*} handler 描画ハンドラー
		 * @param {number=} [opt_normalDir=Math.PI / -2] 法線方向
		 */
		constructor(handler, opt_normalDir = Math.PI / -2) {
			this._handler   = handler;
			this._normalDir = opt_normalDir;
			this._edge      = NORMAL_EDGE;
		}

		/**
		 * エッジ
		 * @param {function=} func エッジを決める関数
		 * @return {function|Liner} エッジ／このライナー
		 */
		edge(func, ...fs) {
			if (func === undefined) return this._edge;
			this._edge = fs.length ? PATH.mixEdge(func, ...fs) : func;
		}


		// 線分 --------------------------------------------------------------------


		/**
		 * 線分をかく
		 * @param {*} x0 始点 x座標
		 * @param {*} y0 始点 y座標
		 * @param {*} dir 方向
		 * @param {*} dist 長さ
		 * @param {*} [opt_limit=null] 長さ制限
		 * @param {*} [opt_retArea=null] エリアを返す配列
		 * @return
		 */
		line(x0, y0, dir, dist, opt_limit = null, opt_retArea = null) {
			const r = rad(dir);
			const x1 = x0 + dist * Math.cos(r), y1 = y0 + dist * Math.sin(r);
			const roughSpan = Math.ceil(Math.abs(dist));
			return this._linePre(x0, y0, x1, y1, dir, roughSpan, opt_limit, opt_retArea);
		}

		/**
		 * 線分をかく（始点x、y座標、終点x，y座標、<長さ制限>、<エリアを返す配列>）
		 * @param {*} x0
		 * @param {*} y0
		 * @param {*} x1
		 * @param {*} y1
		 * @param {*} [opt_limit=null]
		 * @param {*} [opt_retArea=null]
		 * @return
		 */
		lineAbs(x0, y0, x1, y1, opt_limit = null, opt_retArea = null) {
			const dir = degOf(x0, y0, x1, y1);
			const roughSpan = Math.ceil(lenOf(x0, y0, x1, y1));
			return this._linePre(x0, y0, x1, y1, dir, roughSpan, opt_limit, opt_retArea);
		}

		/**
		 * 線分をかく準備をする（始点x、y座標、終点x，y座標，終点方向、長さ、<長さ制限>、<エリアを返す配列>）（ライブラリ内だけで使用）
		 * @private
		 * @param {*} x0
		 * @param {*} y0
		 * @param {*} x1
		 * @param {*} y1
		 * @param {*} dirEnd
		 * @param {*} roughSpan
		 * @param {*} opt_limit
		 * @param {*} opt_retArea
		 * @return
		 */
		_linePre(x0, y0, x1, y1, dirEnd, roughSpan, opt_limit, opt_retArea) {
			const { span, limitedSpan, paramT } = _lineLen(x0, y0, x1, y1, roughSpan, opt_limit, opt_retArea);

			if (opt_limit === null) {
			} else {
				[x1, y1] = _linePoints(paramT, x0, y0, x1, y1);
			}
			if (this._edge) {
				this._lineDraw(dirEnd, x0, y0, rad(dirEnd), x1, y1, span, limitedSpan, this._edge);
			} else {
				this._handler.lineOrMoveTo(x1, y1, dirEnd);
			}
			return limitedSpan;
		}

		/**
		 * 線分を実際にかく（終点方向、始点x、y座標、方向、終点x、y座標、長さ、制限長さ、エッジ）（ライブラリ内だけで使用）
		 * @private
		 * @param {*} dirEnd
		 * @param {*} x0
		 * @param {*} y0
		 * @param {*} r
		 * @param {*} x1
		 * @param {*} y1
		 * @param {*} span
		 * @param {*} limitedSpan
		 * @param {*} edge
		 */
		_lineDraw(dirEnd, x0, y0, r, x1, y1, span, limitedSpan, edge) {
			const nd = this._normalDir;
			const nR = r + nd, nX = Math.cos(nR), nY = Math.sin(nR);

			for (let i = 0, I = Math.ceil(limitedSpan); i <= I; i += 1) {
				const t = i / I, tp = 1 - t;
				const x = tp * x0 + t * x1, y = tp * y0 + t * y1;
				const l = limitedSpan * t;

				const nD = edge(l, span);
				const nXd = nD * nX, nYd = nD * nY;
				this._handler.lineOrMoveTo(x + nXd, y + nYd, dirEnd);
			}
		}


		// 二次ベジェ曲線 ----------------------------------------------------------


		/**
		 * 二次ベジェ曲線をかく（始点x、y座標、方向1、長さ1、方向2、長さ2、<長さ制限>、<エリアを返す配列>）
		 * @param {*} x0
		 * @param {*} y0
		 * @param {*} dir
		 * @param {*} dist0
		 * @param {*} deg0
		 * @param {*} dist1
		 * @param {*} [opt_limit=null]
		 * @param {*} [opt_retArea=null]
		 * @return
		 */
		quadCurve(x0, y0, dir, dist0, deg0, dist1, opt_limit = null, opt_retArea = null) {
			const r0 = rad(dir), r1 = rad(dir + deg0);
			const x1 = x0 + dist0 * Math.cos(r0), y1 = y0 + dist0 * Math.sin(r0);
			const x2 = x1 + dist1 * Math.cos(r1), y2 = y1 + dist1 * Math.sin(r1);
			const roughSpan = Math.ceil(Math.abs(dist0) + Math.abs(dist1));
			return this._quadCurvePre(x0, y0, x1, y1, x2, y2, dir + deg0, roughSpan, opt_limit, opt_retArea);
		}

		/**
		 * 二次ベジェ曲線をかく（始点x、y座標、制御点x、y座標、終点x、y座標、<長さ制限>、<エリアを返す配列>）
		 * @param {*} x0
		 * @param {*} y0
		 * @param {*} x1
		 * @param {*} y1
		 * @param {*} x2
		 * @param {*} y2
		 * @param {*} [opt_limit=null]
		 * @param {*} [opt_retArea=null]
		 * @return
		 */
		quadCurveAbs(x0, y0, x1, y1, x2, y2, opt_limit = null, opt_retArea = null) {
			const roughSpan = Math.ceil(lenOf(x0, y0, x1, y1) + lenOf(x1, y1, x2, y2));
			return this._quadCurvePre(x0, y0, x1, y1, x2, y2, null, roughSpan, opt_limit, opt_retArea);
		}

		/**
		 * 二次ベジェ曲線をかく準備をする（始点x、y座標、制御点x、y、終点x、y座標、終点方向、長さ、<長さ制限>、<エリアを返す配列>）（ライブラリ内だけで使用）
		 * @private
		 * @param {*} x0
		 * @param {*} y0
		 * @param {*} x1
		 * @param {*} y1
		 * @param {*} x2
		 * @param {*} y2
		 * @param {*} dirEnd
		 * @param {*} roughSpan
		 * @param {*} opt_limit
		 * @param {*} opt_retArea
		 * @return
		 */
		_quadCurvePre(x0, y0, x1, y1, x2, y2, dirEnd, roughSpan, opt_limit, opt_retArea) {
			const { span, limitedSpan, paramT } = _quadLen(x0, y0, x1, y1, x2, y2, roughSpan, opt_limit, opt_retArea);

			if (opt_limit === null) {
				if (dirEnd === null) dirEnd = degOf(x1, y1, x2, y2);
			} else {
				[x1, y1, x2, y2] = _quadPoints(paramT, x0, y0, x1, y1, x2, y2);
				dirEnd = degOf(x1, y1, x2, y2);
			}
			if (this._edge) {
				this._quadCurveDraw(dirEnd, x0, y0, x1, y1, x2, y2, span, limitedSpan, this._edge);
			} else {
				this._handler.quadCurveOrMoveTo(x1, y1, x2, y2, dirEnd);
			}
			return limitedSpan;
		}

		/**
		 * 二次ベジェ曲線を実際にかく（終点方向、始点x、y座標、ハンドルx、y座標、終点x、y座標、長さ、制限長さ、エッジ）（ライブラリ内だけで使用）
		 * @private
		 * @param {*} dirEnd
		 * @param {*} x0
		 * @param {*} y0
		 * @param {*} x1
		 * @param {*} y1
		 * @param {*} x2
		 * @param {*} y2
		 * @param {*} span
		 * @param {*} limitedSpan
		 * @param {*} edge
		 */
		_quadCurveDraw(dirEnd, x0, y0, x1, y1, x2, y2, span, limitedSpan, edge) {
			const nd = this._normalDir;
			let px = x0, py = y0, l = 0;

			for (let i = 1, I = Math.ceil(limitedSpan); i <= I; i += 1) {
				const t = i / I, tp = 1 - t;
				const k0 = tp * tp, k1 = 2 * t * tp, k2 = t * t;
				const x = k0 * x0 + k1 * x1 + k2 * x2;
				const y = k0 * y0 + k1 * y1 + k2 * y2;
				const at = Math.atan2(y - py, x - px);
				const de = (i === I) ? dirEnd : deg(at);
				l += Math.sqrt((x - px) * (x - px) + (y - py) * (y - py));
				px = x;
				py = y;

				const nD = edge(l, span);
				if (0 !== nD) {
					const nXd = nD * Math.cos(at + nd), nYd = nD * Math.sin(at + nd);
					this._handler.lineOrMoveTo(x + nXd, y + nYd, de);
				} else {
					this._handler.lineOrMoveTo(x, y, de);
				}
			}
		}


		// 三次ベジェ曲線 ----------------------------------------------------------


		/**
		 * 三次ベジェ曲線をかく（始点x、y座標、方向1、長さ1、方向2、長さ2、方向3、長さ3、<長さ制限>、<エリアを返す配列>）
		 * @param {*} x0
		 * @param {*} y0
		 * @param {*} dir
		 * @param {*} dist0
		 * @param {*} deg0
		 * @param {*} dist1
		 * @param {*} deg1
		 * @param {*} dist2
		 * @param {*} [opt_limit=null]
		 * @param {*} [opt_retArea=null]
		 * @return
		 */
		bezierCurve(x0, y0, dir, dist0, deg0, dist1, deg1, dist2, opt_limit = null, opt_retArea = null) {
			const r0 = rad(dir), r1 = rad(dir + deg0), r2 = rad(dir + deg0 + deg1);
			const x1 = x0 + dist0 * Math.cos(r0), y1 = y0 + dist0 * Math.sin(r0);
			const x2 = x1 + dist1 * Math.cos(r1), y2 = y1 + dist1 * Math.sin(r1);
			const x3 = x2 + dist2 * Math.cos(r2), y3 = y2 + dist2 * Math.sin(r2);
			const roughSpan = Math.ceil(Math.abs(dist0) + Math.abs(dist1) + Math.abs(dist2));
			return this._bezierCurvePre(x0, y0, x1, y1, x2, y2, x3, y3, dir + deg0 + deg1, roughSpan, opt_limit, opt_retArea);
		}

		/**
		 * 三次ベジェ曲線をかく（始点x、y座標、制御点1x、y座標、制御点2x、y座標、終点x、y座標、<長さ制限>、<エリアを返す配列>）
		 * @param {*} x0
		 * @param {*} y0
		 * @param {*} x1
		 * @param {*} y1
		 * @param {*} x2
		 * @param {*} y2
		 * @param {*} x3
		 * @param {*} y3
		 * @param {*} [opt_limit=null]
		 * @param {*} [opt_retArea=null]
		 * @return
		 */
		bezierCurveAbs(x0, y0, x1, y1, x2, y2, x3, y3, opt_limit = null, opt_retArea = null) {
			const roughSpan = Math.ceil(lenOf(x0, y0, x1, y1) + lenOf(x1, y1, x2, y2) + lenOf(x2, y2, x3, y3));
			return this._bezierCurvePre(x0, y0, x1, y1, x2, y2, x3, y3, null, roughSpan, opt_limit, opt_retArea);
		}

		/**
		 * 三次ベジェ曲線をかく準備をする（始点x、y座標、制御点1x、y、制御点2x、y、終点x、y座標、終点方向、長さ、<長さ制限>、<エリアを返す配列>）（ライブラリ内だけで使用）
		 * @private
		 * @param {*} x0
		 * @param {*} y0
		 * @param {*} x1
		 * @param {*} y1
		 * @param {*} x2
		 * @param {*} y2
		 * @param {*} x3
		 * @param {*} y3
		 * @param {*} dirEnd
		 * @param {*} roughSpan
		 * @param {*} opt_limit
		 * @param {*} opt_retArea
		 * @return
		 */
		_bezierCurvePre(x0, y0, x1, y1, x2, y2, x3, y3, dirEnd, roughSpan, opt_limit, opt_retArea) {
			const { span, limitedSpan, paramT } = _bezierLen(x0, y0, x1, y1, x2, y2, x3, y3, roughSpan, opt_limit, opt_retArea);

			if (opt_limit === null) {
				if (dirEnd === null) dirEnd = degOf(x2, y2, x3, y3);
			} else {
				[x1, y1, x2, y2, x3, y3] = _bezierPoints(paramT, x0, y0, x1, y1, x2, y2, x3, y3);
				dirEnd = degOf(x2, y2, x3, y3);
			}
			if (this._edge) {
				this._bezierCurveDraw(dirEnd, x0, y0, x1, y1, x2, y2, x3, y3, span, limitedSpan, this._edge);
			} else {
				this._handler.bezierCurveOrMoveTo(x1, y1, x2, y2, x3, y3, dirEnd);
			}
			return limitedSpan;
		}

		/**
		 * 三次ベジェ曲線を実際にかく（終点方向、始点x、y座標、ハンドル1x、y座標、ハンドル2x、y座標、終点x、y座標、長さ、制限長さ、エッジ）（ライブラリ内だけで使用）
		 * @private
		 * @param {*} dirEnd
		 * @param {*} x0
		 * @param {*} y0
		 * @param {*} x1
		 * @param {*} y1
		 * @param {*} x2
		 * @param {*} y2
		 * @param {*} x3
		 * @param {*} y3
		 * @param {*} span
		 * @param {*} limitedSpan
		 * @param {*} edge
		 */
		_bezierCurveDraw(dirEnd, x0, y0, x1, y1, x2, y2, x3, y3, span, limitedSpan, edge) {
			const nd = this._normalDir;
			let px = x0, py = y0, l = 0;

			for (let i = 1, I = Math.ceil(limitedSpan); i <= I; i += 1) {
				const t = i / I, tp = 1 - t;
				const k0 = tp * tp * tp, k1 = 3 * t * tp * tp;
				const k2 = 3 * t * t * tp, k3 = t * t * t;
				const x = k0 * x0 + k1 * x1 + k2 * x2 + k3 * x3;
				const y = k0 * y0 + k1 * y1 + k2 * y2 + k3 * y3;
				const at = Math.atan2(y - py, x - px);
				const de = (i === I) ? dirEnd : deg(at);
				l += Math.sqrt((x - px) * (x - px) + (y - py) * (y - py));
				px = x;
				py = y;

				const nD = edge(l, span);
				if (0 !== nD) {
					const nXd = nD * Math.cos(at + nd), nYd = nD * Math.sin(at + nd);
					this._handler.lineOrMoveTo(x + nXd, y + nYd, de);
				} else {
					this._handler.lineOrMoveTo(x, y, de);
				}
			}
		}


		// 円弧 --------------------------------------------------------------------


		/**
		 * 円弧をかく（中心x、y座標、方向、横半径、たて半径、開始角度、終了角度、反時計回り？、長さ制限、<エリアを返す配列>）
		 * @param {*} cx
		 * @param {*} cy
		 * @param {*} dir
		 * @param {*} w
		 * @param {*} h
		 * @param {*} deg0
		 * @param {*} deg1
		 * @param {boolean} [anticlockwise=false]
		 * @param {*} [opt_limit=null]
		 * @param {*} [opt_retArea=null]
		 * @return
		 */
		arc(cx, cy, dir, w, h, deg0, deg1, anticlockwise = false, opt_limit = null, opt_retArea = null) {
			if (-E < w && w < E) w = (0 < w) ? E : -E;
			if (-E < h && h < E) h = (0 < h) ? E : -E;

			deg0 %= 360;
			deg1 %= 360;
			if (Math.abs(deg0) > 180) deg0 += (deg0 < 0) ? 360 : -360
			if (Math.abs(deg1) > 180) deg1 += (deg1 < 0) ? 360 : -360
			if (anticlockwise) {  // 向きの考慮に必要
				while (deg0 < deg1) deg1 -= 360;
			} else {
				while (deg1 < deg0) deg1 += 360;
			}
			if (deg0 === deg1) {
				if (anticlockwise) deg1 -= 360;
				else deg1 += 360;
			}
			if (dir == null) dir = 0;
			const roughSpan = Math.PI * (w + h);
			return this._arcPre(cx, cy, rad(dir), w, h, rad(deg0), rad(deg1), anticlockwise, roughSpan, opt_limit, opt_retArea);
		}

		/**
		 * 円弧をかく準備をする（中心x、y座標、方向ラジアン、横半径、たて半径、開始ラジアン、終了ラジアン、反時計回り？、長さ、<長さ制限>、<エリアを返す配列>）（ライブラリ内だけで使用）
		 * @private
		 * @param {*} cx
		 * @param {*} cy
		 * @param {*} dr
		 * @param {*} w
		 * @param {*} h
		 * @param {*} r0
		 * @param {*} r1
		 * @param {*} ac
		 * @param {*} roughSpan
		 * @param {*} opt_limit
		 * @param {*} opt_retArea
		 * @return
		 */
		_arcPre(cx, cy, dr, w, h, r0, r1, ac, roughSpan, opt_limit, opt_retArea) {
			const { span, limitedSpan, paramT } = _arcLen(cx, cy, dr, w, h, r0, r1, roughSpan, opt_limit, opt_retArea);

			if (opt_limit === null) {
			} else {
				const t = paramT, tp = 1 - t;
				r1 = tp * r0 + t * r1;
			}
			// r1の角度を計算
			const s1 = w * Math.cos(r1), t1 = h * Math.sin(r1);
			const a1 = Math.atan2(-h * h * s1, w * w * t1) + (ac ? 0 : Math.PI);  // 時計回り、反時計回りの接線の傾き
			const dirEnd = deg(dr) + deg(a1);

			if (this._edge) {
				this._arcDraw(dirEnd, cx, cy, dr, w, h, r0, r1, span, limitedSpan, this._edge);
			} else {
				// r1の座標を計算
				const sin = Math.sin(dr), cos = Math.cos(dr);
				const sp = s1 * cos - t1 * sin, tp = s1 * sin + t1 * cos;
				this._handler.arcOrMoveTo(cx, cy, dr, w, h, r0, r1, ac, dirEnd, cx + sp, cy + tp);
			}
			return limitedSpan;
		}

		/**
		 * 円弧を実際にかく（終点方向、中心x、y座標、方向、横半径、たて半径、開始角度、終了角度、長さ、制限長さ、エッジ）（ライブラリ内だけで使用）
		 * @private
		 * @param {*} dirEnd
		 * @param {*} cx
		 * @param {*} cy
		 * @param {*} dr
		 * @param {*} w
		 * @param {*} h
		 * @param {*} r0
		 * @param {*} r1
		 * @param {*} span
		 * @param {*} limitedSpan
		 * @param {*} edge
		 */
		_arcDraw(dirEnd, cx, cy, dr, w, h, r0, r1, span, limitedSpan, edge) {
			const nd = this._normalDir;
			const sin = Math.sin(dr), cos = Math.cos(dr);
			let px = w * Math.cos(r0), py = h * Math.sin(r0), l = 0;

			for (let i = 1, I = Math.ceil(limitedSpan); i <= I; i += 1) {
				const t = i / I, tp = 1 - t;
				const r = tp * r0 + t * r1;
				const x = w * Math.cos(r), y = h * Math.sin(r);
				const at = Math.atan2(y - py, x - px);
				const de = (i === I) ? dirEnd : deg(at + dr);
				l += Math.sqrt((x - px) * (x - px) + (y - py) * (y - py));
				px = x; py = y;

				const nD = edge(l, span);
				let nXd = 0, nYd = 0;
				if (0 !== nD) {
					nXd = nD * Math.cos(at + nd);
					nYd = nD * Math.sin(at + nd);
				}
				const xr = cx + (x + nXd) * cos - (y + nYd) * sin;
				const yr = cy + (x + nXd) * sin + (y + nYd) * cos;
				this._handler.lineOrMoveTo(xr, yr, de);
			}
		}

	}


	// デフォルト・ハンドラー生成関数 ------------------------------------------


	/**
	 * デフォルト・ハンドラーを作る
	 * @param {Paper|CanvasRenderingContext2D} ctx 紙／キャンバス・コンテキスト
	 * @return {*} ハンドラー
	 */
	const makeDefaultHandler = function (ctx) {
		return {
			/**
			 * 線分をかくかペンの場所を変更する
			 * @param {number} x 終点x座標
			 * @param {number} y 終点y座標
			 * @param {number} dir 終点方向
			 */
			lineOrMoveTo: function (x, y, dir) {
				ctx.lineTo(x, y);
			},
			/**
			 * 二次ベジェ曲線をかくかペンの場所を変更する
			 * @param {number} x1 ハンドルx座標
			 * @param {number} y1 ハンドルy座標
			 * @param {number} x2 終点x座標
			 * @param {number} y2 終点y座標
			 * @param {number} dir 終点方向
			 */
			quadCurveOrMoveTo: function (x1, y1, x2, y2, dir) {
				ctx.quadraticCurveTo(x1, y1, x2, y2);
			},
			/**
			 * 三次ベジェ曲線をかくかペンの場所を変更する
			 * @param {number} x1 ハンドル1x座標
			 * @param {number} y1 ハンドル1y座標
			 * @param {number} x2 ハンドル2x座標
			 * @param {number} y2 ハンドル2y座標
			 * @param {number} x3 終点x座標
			 * @param {number} y3 終点y座標
			 * @param {number} dir 終点方向
			 */
			bezierCurveOrMoveTo: function (x1, y1, x2, y2, x3, y3, dir) {
				ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3);
			},
			/**
			 * 円弧をかくかペンの場所を変更する
			 * @param {number} cx 中心x座標
			 * @param {number} cy 中心y座標
			 * @param {number} dr 方向
			 * @param {number} w 横半径
			 * @param {number} h たて半径
			 * @param {number} r0 開始角度
			 * @param {number} r1 終了角度
			 * @param {boolean} ac 反時計回り？
			 * @param {number} dir 終点方向
			 * @param {number} xx 終点x座標
			 * @param {number} yy 終点y座標
			 */
			arcOrMoveTo: function (cx, cy, dr, w, h, r0, r1, ac, dir, xx, yy) {
				eclipse(ctx, cx, cy, w, h, dr, r0, r1, ac);
			}
		};
	};


	/**
	 * エッジ生成関数
	 * @author Takuto Yanagida
	 * @version 2021-05-21
	 */


	const NORMAL_EDGE = null;


	/**
	 * 直線のエッジを作る
	 * @return {function(number, number):number} 直線のエッジ
	 */
	const normalEdge = function () {
		return NORMAL_EDGE;
	};

	/**
	 * サイン波のエッジを作る
	 * @param {number=} [length=10] 長さ
	 * @param {number=} [amplitude=10] 振幅
	 * @param {*=} [opt={}] オプション
	 * @return {function(number, number):number} サイン波のエッジ
	 */
	const sineEdge = function (length = 10, amplitude = 10, opt = {}) {
		return _makeEdge(length, amplitude, opt, function (p) {
			return Math.sin(p * Math.PI * 2);
		}, -0.25, 0.25);
	};

	/**
	 * 矩形波のエッジを作る
	 * @param {number=} [length=10] 長さ
	 * @param {number=} [amplitude=10] 振幅
	 * @param {*=} [opt={}] オプション
	 * @return {function(number, number):number} 矩形波のエッジ
	 */
	const squareEdge = function (length = 10, amplitude = 10, opt = {}) {
		return _makeEdge(length, amplitude, opt, function (p) {
			if (p < 0.01) return p / 0.01;
			if (p < 0.49) return 1;
			if (p < 0.51) return -(p - 0.5) / 0.01;
			if (p < 0.99) return -1;
			return (p - 1) / 0.01;
		}, -0.01, 0.01);
	};

	/**
	 * 三角波のエッジを作る
	 * @param {number=} [length=10] 長さ
	 * @param {number=} [amplitude=10] 振幅
	 * @param {*=} [opt={}] オプション
	 * @return {function(number, number):number} 三角波のエッジ
	 */
	const triangleEdge = function (length = 10, amplitude = 10, opt = {}) {
		return _makeEdge(length, amplitude, opt, function (p) {
			if (p < 0.25) return p / 0.25;
			if (p < 0.75) return -(p - 0.5) / 0.25;
			return (p - 1) / 0.25;
		}, -0.25, 0.25);
	};

	/**
	 * のこぎり波のエッジを作る
	 * @param {number=} [length=10] 長さ
	 * @param {number=} [amplitude=10] 振幅
	 * @param {*=} [opt={}] オプション
	 * @return {function(number, number):number} のこぎり波のエッジ
	 */
	const sawtoothEdge = function (length = 10, amplitude = 10, opt = {}) {
		return _makeEdge(length, amplitude, opt, function (p) {
			if (p < 0.49) return p / 0.49;
			if (p < 0.51) return -(p - 0.5) / 0.01;
			return (p - 1) / 0.49;
		}, -0.49, 0.49);
	};

	/**
	 * サインの絶対値の波形のエッジを作る
	 * @param {number=} [length=10] 長さ
	 * @param {number=} [amplitude=10] 振幅
	 * @param {*=} [opt={}] オプション
	 * @return {function(number, number):number} サイン波のエッジ
	 */
	const absSineEdge = function (length = 10, amplitude = 10, opt = {}) {
		return _makeEdge(length, amplitude, opt, function (p) {
			return Math.abs(Math.sin(p * Math.PI + Math.PI / 6)) * 2 - 1;
		}, -1 / 6, 1 / 3);
	};

	/**
	 * ノイズのエッジを作る
	 * @param {number=} [length=10] 長さ
	 * @param {number=} [amplitude=10] 振幅
	 * @param {*=} [opt={}] オプション
	 * @return {function(number, number):number} ノイズのエッジ
	 */
	const noiseEdge = function (length = 10, amplitude = 10, opt = {}) {
		if (typeof CALC === 'undefined') throw new Error('Calcライブラリが必要です。');
		const amp = 2 * amplitude;

		const p = (CROQUJS.currentPaper()) ? CROQUJS.currentPaper() : null;
		let lastFrame = 0;
		let off = 0;

		return function (x, max) {
			max = Math.round(max * 100) / 100;
			const l = 1 / Math.min(length, max);
			let d = (0 | (max * l)) / max;
			if (d === (0 | d)) d += 0.01;
			let s = d * x;
			if (Math.abs(x - max) < 0.01) {
				s = 0 | s;
				if (p) off += d * max;
			}
			if (p && p.totalFrame() !== lastFrame) {
				lastFrame = p.totalFrame();
				off = 0;
			}
			return (CALC.noise(s + off) - 0.5) * amp;
		};
	};

	/**
	 * いくつかのエッジを混ぜたエッジを作る
	 * @param {function(number, number):number} func エッジ
	 * @param {...function(number, number):number} fs いくつかのエッジ
	 * @return {function(number, number):number} 混ざったエッジ
	 */
	const mixEdge = function (func, ...fs) {
		return function (x, max) {
			let v = func(x, max);
			for (const f of fs) v += f(x, max);
			return v;
		};
	};

	/**
	 * エッジを作る（ライブラリ内だけで使用）
	 * @private
	 * @param {number} length 長さ
	 * @param {number} amplitude 振幅
	 * @param {*} opt オプション
	 * @param {function(number):number} func 関数（原点を通り振幅±1）
	 * @param {number} minPhase 最小値フェーズ
	 * @param {number} maxPhase 最大値フェーズ
	 * @return {function(number, number):number} エッジ
	 */
	const _makeEdge = function (length, amplitude, opt, fn, minPhase, maxPhase) {
		let amp = 0.5 * amplitude;
		let phase = minPhase, off = 1, rev = 1;

		if (opt.centering) {
			phase = 0;
			off = 0;
		}
		if (opt.reverse) {
			phase = maxPhase;
			rev = -1;
		}
		if (opt.flip) {
			amp *= -1;
		}
		return function (x, max) {
			const l = max / Math.max(1, (~~(max / length)));
			let p = x % l / l + phase;
			if (p < 0) p += 1;
			return (fn(p) * rev + off) * amp;
		};
	};


	// ユーティリティ関数 ------------------------------------------------------


	/**
	 * 円や弧をかく関数の引数を整える
	 * @param {number|number[]} r 半径（配列なら横半径とたて半径）
	 * @param {number|number[]} deg 角度（配列なら開始角度と終了角度）
	 * @param {number} [step=1] 係数
	 * @return {object} 引数
	 */
	const arrangeArcParams = function (r, deg, step = 1) {
		const ap = {};

		// 半径の引数を整える（負もOKに）
		if (Array.isArray(r)) {
			if (r.length < 2) throw new Error('PATH::arrangeArcParams: 半径rは配列なのに、数が一つしか含まれていません。');
			ap.w = r[0] * step;
			ap.h = r[1] * step;
		} else {
			ap.w = ap.h = r * step;
		}
		if (-E < ap.w && ap.w < E) ap.w = (0 < ap.w) ? E : -E;
		if (-E < ap.h && ap.h < E) ap.h = (0 < ap.h) ? E : -E;

		// 角度の引数を整える
		if (Array.isArray(deg)) {
			if (deg.length < 2) throw new Error('PATH::arrangeArcParams: 角度degは配列なのに、数が一つしか含まれていません。');
			ap.deg0 = deg[0];
			ap.deg1 = deg[1];
		} else {
			ap.deg0 = 0;
			ap.deg1 = deg;
		}
		return ap;
	};

	/**
	 * 円をかく
	 * @param {Paper|CanvasRenderingContext2D} ctx 紙／キャンバス・コンテキスト
	 * @param {number} cx 中心x座標
	 * @param {number} cy 中心y座標
	 * @param {number} w 横幅
	 * @param {number} h たて幅
	 * @param {number} dr 向き
	 * @param {number} r0 開始ラジアン
	 * @param {number} r1 終了ラジアン
	 * @param {boolean} ac 反時計回り？
	 */
	const eclipse = function (ctx, cx, cy, w, h, dr, r0, r1, ac) {
		// 負の半径もOKに
		if (w <= 0 || h <= 0 || ctx.ellipse === undefined) {
			ctx.save();
			ctx.translate(cx, cy);
			ctx.rotate(dr);
			ctx.scale(w, h);
			ctx.arc(0, 0, 1, r0, r1, ac);
			ctx.restore();
		} else {
			ctx.ellipse(cx, cy, w, h, dr, r0, r1, ac);
		}
	};


	// ライブラリを作る --------------------------------------------------------


	return {
		Liner,
		makeDefaultHandler,

		normalEdge,
		sineEdge,
		squareEdge,
		triangleEdge,
		sawtoothEdge,
		absSineEdge,
		noiseEdge,
		mixEdge,

		arrangeArcParams,
		eclipse,
	};

}());
