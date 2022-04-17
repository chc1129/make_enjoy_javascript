/**
 * クロッキー・ライブラリ（CROQUJS）
 *
 * 絵をかくための紙を作るライブラリです。
 * このライブラリは、HTMLについて知っていなくてもJavaScriptから簡単に絵をかけ、
 * マウスの操作に対応できるようにするための準備をするものです。
 * （ここでの紙は、HTML5のCanvas要素のCanvasRenderingContext2Dを拡張したもののことです）
 *
 * @author Takuto Yanagida
 * @version 2021-05-21
 */


/**
 * ライブラリ変数
 */
const CROQUJS = (function () {

	'use strict';


	// 共通のCSS
	const s = document.createElement('style');
	s.innerHTML = `
		* {
			box-sizing: border-box;
		}
		body {
			display    : flex;
			align-items: flex-start;
			flex-wrap  : wrap;
			margin     : 0;
			padding    : 2px;
			white-space: nowrap;
		}
	`;
	document.head.appendChild(s);

	// すべてのプログラム（スクリプト）を読み込み終わったらsetup関数を呼び出すように、イベント・リスナーを登録する
	window.addEventListener('load', () => {
		if (typeof setup === 'function') {
			setup();
		}
	}, true);


	// ペーパー（CROQUJS.Paper) ------------------------------------------------


	const CANVAS_TO_PAPER = {};


	/**
	 * キー操作処理
	 * @author Takuto Yanagida
	 * @version 2021-05-21
	 */
	class KeyHandler {

		/**
		 * キー操作処理を作る
		 * @constructor
		 * @param {HTMLCanvasElement} can キャンバス
		 */
		constructor(can) {
			this._keys = {};
			this._onDown = null;
			this._onUp = null;

			// キー・ダウン（キーが押された）イベントに対応する
			can.addEventListener('keydown', (e) => {
				if (!this._keys[e.key]) {
					if (this._onDown !== null) {
						this._onDown(e.key, e);
						e.preventDefault();
					}
					this._keys[e.key] = true;
				}
			}, true);

			// キー・アップ（キーが離された）イベントに対応する
			can.addEventListener('keyup', (e) => {
				if (this._keys[e.key]) {
					if (this._onUp !== null) {
						this._onUp(e.key, e);
						e.preventDefault();
					}
					this._keys[e.key] = false;
				}
			}, true);
		}


		// 公開関数 ----------------------------------------------------------------


		/**
		 * キー・ダウン（キーが押された）イベントに対応する関数をセットする
		 * @param {function(string, KeyboardEvent):void=} handler 関数
		 * @return {function(string, KeyboardEvent):void=} 関数
		 */
		onKeyDown(handler) {
			if (handler === undefined) return this._onDown;
			this._onDown = handler;
		}

		/**
		 * キー・アップ（キーが離された）イベントに対応する関数をセットする
		 * @param {function(string, KeyboardEvent):void=} handler 関数
		 * @return {function(string, KeyboardEvent):void=} 関数
		 */
		onKeyUp(handler) {
			if (handler === undefined) return this._onUp;
			this._onUp = handler;
		}

		/**
		 * カーソル・キーの左が押されているか？
		 * @return {boolean} カーソル・キーの左が押されているか
		 */
		keyArrowLeft() {
			return this._keys['ArrowLeft'];
		}

		/**
		 * カーソル・キーの上が押されているか？
		 * @return {boolean} カーソル・キーの上が押されているか
		 */
		keyArrowUp() {
			return this._keys['ArrowUp'];
		}

		/**
		 * カーソル・キーの右が押されているか？
		 * @return {boolean} カーソル・キーの右が押されているか
		 */
		keyArrowRight() {
			return this._keys['ArrowRight'];
		}

		/**
		 * カーソル・キーの下が押されているか？
		 * @return {boolean} カーソル・キーの下が押されているか
		 */
		keyArrowDown() {
			return this._keys['ArrowDown'];
		}

	}


	/**
	 * マウス操作処理
	 * @author Takuto Yanagida
	 * @version 2021-05-21
	 */
	class MouseHandler {

		/**
		 * マウス操作処理を作る
		 * @constructor
		 * @param {HTMLCanvasElement} can キャンバス
		 */
		constructor(can) {
			this._canvas = can;
			this._children = [];

			this._posX = 0;
			this._posY = 0;
			this._btnL = false;
			this._btnR = false;
			this._btnM = false;
			this._btns = 0;

			this._onDown = null;
			this._onMove = null;
			this._onUp = null;
			this._onClick = null;
			this._onWheel = null;

			// ウィンドウにイベント・リスナーをセット
			this._onDownWinListener = this._onDownWin.bind(this);
			this._onMoveWinListener = this._onMoveWin.bind(this);
			this._onUpWinListener = this._onUpWin.bind(this);
			this._onBlurWinListener = () => { this._btns = 0; };

			window.addEventListener('mousedown', this._onDownWinListener, true);
			window.addEventListener('dragstart', this._onDownWinListener, true);
			window.addEventListener('mousemove', this._onMoveWinListener, true);
			window.addEventListener('drag', this._onMoveWinListener, true);
			window.addEventListener('mouseup', this._onUpWinListener, false);
			window.addEventListener('dragend', this._onUpWinListener, false);
			window.addEventListener('blur', this._onBlurWinListener);

			// キャンバスにイベント・リスナーをセット
			if (window.PointerEvent) {
				this._canvas.addEventListener('pointerdown', this._onDownCan.bind(this), true);
				this._canvas.addEventListener('pointermove', this._onMoveCan.bind(this), true);
				this._canvas.addEventListener('pointerup', this._onUpCan.bind(this), false);
			} else {  // Mouse
				this._canvas.addEventListener('mousedown', this._onDownCan.bind(this), true);
				this._canvas.addEventListener('mousemove', this._onMoveCan.bind(this), true);
				this._canvas.addEventListener('mouseup', this._onUpCan.bind(this), false);
			}
			this._canvas.addEventListener('click', this._onClickCan.bind(this));
			this._canvas.addEventListener('wheel', this._onWheelCan.bind(this));

			this._canvas.oncontextmenu = () => {
				// イベントが割り当てられている時はコンテキストメニューをキャンセル
				if (this._onUp !== null) return false;
				return true;
			};
		}

		/**
		 * イベント・リスナーを削除する
		 */
		removeWinListener() {
			window.removeEventListener('mousedown', this._onDownWinListener, true);
			window.removeEventListener('dragstart', this._onDownWinListener, true);
			window.removeEventListener('mousemove', this._onMoveWinListener, true);
			window.removeEventListener('drag', this._onMoveWinListener, true);
			window.removeEventListener('mouseup', this._onUpWinListener, false);
			window.removeEventListener('dragend', this._onUpWinListener, false);
			window.removeEventListener('blur', this._onBlurWinListener);
		}

		/**
		 * 子を追加する
		 * @param {MouseHandler} child 子
		 */
		addChild(child) {
			this._children.push(child);
		}

		/**
		 * 子を削除する
		 * @param {MouseHandler} child 子
		 */
		removeChild(child) {
			this._children = this._children.filter(e => (e !== child));
		}


		// ウインドウから直接ボタンのイベントを受け取る ----------------------------


		/**
		 * マウス・ダウン（ボタンが押された）イベントに対応する（ライブラリ内だけで使用）
		 * @private
		 * @param {MouseEvent} e イベント
		 */
		_onDownWin(e) {
			if (e.target !== this._canvas) {
				e.preventDefault();
				return;
			}
			const btnTbl = [1, 4, 2];
			this._btns |= btnTbl[e.button];
			this._setButtonWin(this._btns);
		}

		/**
		 * マウス・ムーブ（ポインターが移動した）イベントに対応する（ライブラリ内だけで使用）
		 * @private
		 * @param {MouseEvent} e イベント
		 */
		_onMoveWin(e) {
			if (e.target !== this._canvas && this._btns === 0) {
				e.preventDefault();
				return;
			}
			if (e.buttons !== undefined) this._btns = e.buttons;
			this._setButtonWin(this._btns);
		}

		/**
		 * マウス・アップ（ボタンが離された）イベントに対応する（ライブラリ内だけで使用）
		 * @private
		 * @param {MouseEvent} e イベント
		 */
		_onUpWin(e) {
			const btnTbl = [1, 4, 2];
			this._btns &= ~btnTbl[e.button];
			this._setButtonWin(this._btns);
		}

		/**
		 * どのマウス・ボタンが押されたのかを記録する（ライブラリ内だけで使用）
		 * @private
		 * @param {number} buttons ボタン
		 */
		_setButtonWin(buttons) {
			this._btnL = (buttons & 1) ? true : false;
			this._btnR = (buttons & 2) ? true : false;
			this._btnM = (buttons & 4) ? true : false;

			for (const c of this._children) {
				c._mouseButtons = buttons;
				c._setButtonWin(buttons);
			}
		}


		// キャンバスからボタンのイベントを受け取る --------------------------------


		/**
		 * マウス・ダウン（ボタンが押された）イベントに対応する（ライブラリ内だけで使用）
		 * @private
		 * @param {MouseEvent} e イベント
		 */
		_onDownCan(e) {
			this._setPosition(e);
			this._setButtonCanvas(e, true);
			if (this._onDown !== null) {
				this._onDown(this._posX, this._posY, e);
				e.preventDefault();
			}
			this._canvas.focus();
		}

		/**
		 * マウス・ムーブ（ポインターが移動した）イベントに対応する（ライブラリ内だけで使用）
		 * @private
		 * @param {MouseEvent} e イベント
		 */
		_onMoveCan(e) {
			this._setPosition(e);
			if (this._onMove !== null) {
				// ウィンドウ外からカーソルが入った時にボタンを検出する前にイベントが発生する問題を回避するため
				setTimeout(() => { this._onMove(this._posX, this._posY, e) }, 1);
				e.preventDefault();
			}
		}

		/**
		 * マウス・アップ（ボタンが離された）イベントに対応する（ライブラリ内だけで使用）
		 * @private
		 * @param {MouseEvent} e イベント
		 */
		_onUpCan(e) {
			this._setPosition(e);
			this._setButtonCanvas(e, false);
			if (this._onUp !== null) {
				this._onUp(this._posX, this._posY, e);
				e.preventDefault();
			}
		}

		/**
		 * クリック・イベントに対応する（ライブラリ内だけで使用）
		 * @private
		 * @param {MouseEvent} e イベント
		 */
		_onClickCan(e) {
			this._setPosition(e);
			if (this._onClick !== null) {
				this._onClick(this._posX, this._posY, e);
				e.preventDefault();
			}
		}

		/**
		 * ホイール・イベントに対応する（ライブラリ内だけで使用）
		 * @private
		 * @param {WheelEvent} e イベント
		 */
		_onWheelCan(e) {
			if (this._onWheel !== null) {
				this._onWheel(0 < e.deltaY ? 1 : -1, e);
				e.preventDefault();
			}
		}

		/**
		 * マウス・イベントの起こった場所（座標）を正しくして記録する（ライブラリ内だけで使用）
		 * @private
		 * @param {MouseEvent|TouchEvent} e イベント
		 */
		_setPosition(e) {
			// タッチの時／マウスの時
			const ee = (e.clientX === undefined) ? e.changedTouches[0] : e;
			const r = this._canvas.getBoundingClientRect();
			this._posX = ee.clientX - r.left;
			this._posY = ee.clientY - r.top;

			for (const c of this._children) {
				c._posX = this._posX;
				c._posY = this._posY;
			}
		}

		/**
		 * どのマウス・ボタンが押されたのかを記録する（ライブラリ内だけで使用）
		 * @private
		 * @param {MouseEvent} e イベント
		 * @param {boolean} val 状態
		 */
		_setButtonCanvas(e, val) {
			// タッチ以外の処理は基本的にInputMouseButtonが担当（以下はタッチイベント関連への簡易対応のため）
			switch (e.button) {
				case 0: this._btnL = val; break;
				case 1: this._btnM = val; break;
				case 2: this._btnR = val; break;
			}
			for (const c of this._children) {
				c._setButtonCanvas(e, val);
			}
		}


		// 公開関数 ----------------------------------------------------------------


		/**
		 * マウス・ダウン（ボタンが押された）イベントに対応する関数をセットする
		 * @param {function(number, number, MouseEvent)=} handler 関数
		 * @return {function(number, number, MouseEvent)=} 関数
		 */
		onMouseDown(handler) {
			if (handler === undefined) return this._onDown;
			this._onDown = handler;
		}

		/**
		 * マウス・ムーブ（ポインターが移動した）イベントに対応する関数をセットする
		 * @param {function(number, number, MouseEvent)=} handler 関数
		 * @return {function(number, number, MouseEvent)=} 関数
		 */
		onMouseMove(handler) {
			if (handler === undefined) return this._onMove;
			this._onMove = handler;
		}

		/**
		 * マウス・アップ（ボタンが離された）イベントに対応する関数をセットする
		 * @param {function(number, number, MouseEvent)=} handler 関数
		 * @return {function(number, number, MouseEvent)=} 関数
		 */
		onMouseUp(handler) {
			if (handler === undefined) return this._onUp;
			this._onUp = handler;
		}

		/**
		 * マウス・クリック・イベントに対応する関数をセットする
		 * @param {function(number, number, MouseEvent)=} handler 関数
		 * @return {function(number, number, MouseEvent)=} 関数
		 */
		onMouseClick(handler) {
			if (handler === undefined) return this._onClick;
			this._onClick = handler;
		}

		/**
		 * マウス・ホイール・イベントに対応する関数をセットする
		 * @param {function(number, WheelEvent)=} handler 関数
		 * @return {function(number, WheelEvent)=} 関数
		 */
		onMouseWheel(handler) {
			if (handler === undefined) return this._onWheel;
			this._onWheel = handler;
		}

		/**
		 * マウスの横の場所を返す
		 * @return {number} マウスの横の場所
		 */
		mouseX() {
			return this._posX;
		}

		/**
		 * マウスのたての場所を返す
		 * @return {number} マウスのたての場所
		 */
		mouseY() {
			return this._posY;
		}

		/**
		 * マウスの左ボタンが押されているか？
		 * @return {boolean} マウスの左ボタンが押されているか
		 */
		mouseLeft() {
			return this._btnL;
		}

		/**
		 * マウスの右ボタンが押されているか？
		 * @return {boolean} マウスの右ボタンが押されているか
		 */
		mouseRight() {
			return this._btnR;
		}

		/**
		 * マウスの中ボタンが押されているか？
		 * @return {boolean} マウスの中ボタンが押されているか
		 */
		mouseMiddle() {
			return this._btnM;
		}

	}


	/**
	 * ズーム操作処理
	 * @author Takuto Yanagida
	 * @version 2021-02-04
	 */
	class ZoomHandler {

		/**
		 * ズーム操作処理を作る
		 * @constructor
		 * @param {Paper|CanvasRenderingContext2D} ctx 紙／キャンバス・コンテキスト
		 */
		constructor(ctx) {
			this._ctx = ctx;
			this._isEnabled = true;

			this._zoom    = 0;
			this._steps   = [1, 1.5, 2, 3, 4, 6, 8, 12, 16, 24, 32];
			this._scale   = 1;
			this._viewOff = { x: 0, y: 0 };
			this._mousePt = { x: 0, y: 0 };

			this._touchPt    = { x: 0, y: 0 };
			this._touchCount = 0;
			this._touchDist  = 0;

			ctx.canvas.addEventListener('wheel',     this._onWheel.bind(this));
			ctx.canvas.addEventListener('mousedown', this._onMouseDown.bind(this));
			ctx.canvas.addEventListener('mousemove', this._onMouseMove.bind(this));

			ctx.canvas.addEventListener('touchstart', this._onTouchStart.bind(this));
			ctx.canvas.addEventListener('touchmove',  this._onTouchMove.bind(this), { passive: false });
		}

		/**
		 * マウス・ダウン（ボタンが押された）イベントに対応する（ライブラリ内だけで使用）
		 * @private
		 */
		_onMouseDown() {
			if (!this._isEnabled || !this._ctx.mouseMiddle()) return;
			this._mousePt = { x: this._ctx.mouseX(), y: this._ctx.mouseY() };
			this._viewOff.px = this._viewOff.x;
			this._viewOff.py = this._viewOff.y;
		}

		/**
		 * マウス・ムーブ（ポインターが移動した）イベントに対応する（ライブラリ内だけで使用）
		 * @private
		 */
		_onMouseMove() {
			if (!this._isEnabled || !this._ctx.mouseMiddle()) return;
			this._setViewOffset(
				this._viewOff.px - (this._ctx.mouseX() - this._mousePt.x),
				this._viewOff.py - (this._ctx.mouseY() - this._mousePt.y)
			);
		}

		/**
		 * ホイール・イベントに対応する（ライブラリ内だけで使用）
		 * @private
		 * @param {WheelEvent} e イベント
		 */
		_onWheel(e) {
			if (!this._isEnabled) return;
			const mx = this._ctx.mouseX(), my = this._ctx.mouseY();

			const px = (this._viewOff.x + mx) / this._scale;
			const py = (this._viewOff.y + my) / this._scale;

			if (0 < e.deltaY) {
				this._zoom = Math.max(this._zoom - 1, 0);
			} else {
				this._zoom = Math.min(this._zoom + 1, this._steps.length - 1);
			}
			this._scale = this._steps[this._zoom];
			this._setViewOffset(
				px * this._scale - mx,
				py * this._scale - my
			);
		}

		/**
		 * ビュー・オフセットをセットする（ライブラリ内だけで使用）
		 * @private
		 * @param {number} x x座標
		 * @param {number} y y座標
		 */
		_setViewOffset(x, y) {
			const w = this._ctx.width(), h = this._ctx.height();
			x = Math.min(Math.max(x, 0), w * this._scale - w);
			y = Math.min(Math.max(y, 0), h * this._scale - h);
			this._viewOff.x = x;
			this._viewOff.y = y;
		}


		// -------------------------------------------------------------------------


		/**
		 * タッチ・スタート・イベントに対応する（ライブラリ内だけで使用）
		 * @private
		 * @param {TouchEvent} e イベント
		 */
		_onTouchStart(e) {
			this._touchDist = 0;
			this._updateTouch(e.touches);
		}

		/**
		 * タッチ・ムーブ・イベントに対応する（ライブラリ内だけで使用）
		 * @private
		 * @param {TouchEvent} e イベント
		 */
		_onTouchMove(e) {
			e.preventDefault();
			e.stopPropagation();

			const ts = e.touches;
			if (this._touchCount !== ts.length) this._updateTouch(ts);

			const [cx, cy] = this._getTouchPoint(ts);
			this._viewOff.x += this._touchPt.x - cx;
			this._viewOff.y += this._touchPt.y - cy;

			this._touchPt.x = cx;
			this._touchPt.y = cy;

			if (2 <= ts.length) {
				const ntX = (cx + this._viewOff.x) / this._scale;
				const ntY = (cy + this._viewOff.y) / this._scale;
				const dis = this._getTouchDistance(ts);

				if (this._touchDist) {
					const s = dis / (this._touchDist * this._scale);
					if (s && s !== Infinity) {
						[this._zoom, this._scale] = this._calcZoomStep(this._scale * s);
						this._setViewOffset(
							ntX * this._scale - cx,
							ntY * this._scale - cy
						);
					}
				}
				this._touchDist = dis / this._scale;
			}
		}

		/**
		 * ズームの段階を計算する（ライブラリ内だけで使用）
		 * @private
		 * @param {number} s スケール（拡大率）
		 */
		_calcZoomStep(s) {
			const ns = Math.min(Math.max(s, 1), this._steps[this._steps.length - 1]);

			let dis = Number.MAX_VALUE;
			let idx = -1;
			for (let i = 0; i < this._steps.length; i += 1) {
				const v = this._steps[i];
				const d = (s - v) * (s - v);
				if (d < dis) {
					dis = d;
					idx = i;
				}
			}
			return [idx, ns];
		}

		/**
		 * タッチ情報を更新する（ライブラリ内だけで使用）
		 * @private
		 * @param {TouchList} ts タッチ
		 */
		_updateTouch(ts) {
			this._touchCount = ts.length;
			[this._touchPt.x, this._touchPt.y] = this._getTouchPoint(ts);
		}

		/**
		 * タッチされた点を求める（ライブラリ内だけで使用）
		 * @private
		 * @param {TouchList} ts タッチ
		 */
		_getTouchPoint(ts) {
			let x = 0, y = 0;
			if (ts.length === 1) {
				x = ts[0].pageX - window.pageXOffset;
				y = ts[0].pageY - window.pageYOffset;
			} else if (2 <= ts.length) {
				x = (ts[0].pageX + ts[1].pageX) / 2 - window.pageXOffset;
				y = (ts[0].pageY + ts[1].pageY) / 2 - window.pageYOffset;
			}
			return [x, y];
		}

		/**
		 * タッチされた2点の距離を求める（ライブラリ内だけで使用）
		 * @private
		 * @param {TouchList} ts タッチ
		 */
		_getTouchDistance(ts) {
			const x1 = ts[0].screenX, y1 = ts[0].screenY;
			const x2 = ts[1].screenX, y2 = ts[1].screenY;
			return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
		}


		// -------------------------------------------------------------------------


		/**
		 * ホイール回転でズームするか
		 * @param {boolean=} val ホイール回転でズームするか
		 * @return {boolean} ホイール回転でズームするか
		 */
		enabled(val) {
			if (val === undefined) return this._isEnabled;
			this._isEnabled = val;
		}

		/**
		 * 絵をかく前の設定をする（紙だけで使用）
		 * @param {Paper|CanvasRenderingContext2D} ctx 紙／キャンバス・コンテキスト
		 */
		beforeDrawing(ctx) {
			if (!this._isEnabled) return;
			const t = ctx.getTransform();

			ctx.save();
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.translate(-this._viewOff.x, -this._viewOff.y);
			ctx.scale(this._scale, this._scale);
			ctx.transform(t.a, t.b, t.c, t.d, t.e, t.f);
		}

		/**
		 * 絵をかいた後で設定を戻す（紙だけで使用）
		 * @param {Paper|CanvasRenderingContext2D} ctx 紙／キャンバス・コンテキスト
		 */
		afterDrawing(ctx) {
			if (!this._isEnabled) return;
			ctx.restore();
		}

	}


	/**
	 * 紙
	 * @version 2021-05-21
	 */
	class Paper {

		/**
		 * 紙を作る
		 * @constructor
		 * @param {number} width 横の大きさ
		 * @param {number} height たての大きさ
		 * @param {boolean} [isVisible=true] 画面に表示する？
		 */
		constructor(width, height, isVisible = true) {
			const can = document.createElement('canvas');
			can.setAttribute('width', '' + (width || 400));
			can.setAttribute('height', '' + (height || 400));
			can.setAttribute('tabindex', '1');

			this._ctx = can.getContext('2d');
			if (!PAPER_IS_AUGMENTED) augmentPaperPrototype(this._ctx);

			// 画面に表示する場合は
			if (isVisible === true) {
				const style = document.createElement('style');
				style.innerHTML = 'body>canvas{border:0 solid lightgray;display:inline-block;touch-action:none;outline:none;}';
				document.head.appendChild(style);

				can.id = 'canvas';
				document.body.appendChild(can);
				can.focus();
			}
			CANVAS_TO_PAPER[can] = this;
			this._augment(can);
			CROQUJS.currentPaper(this);

			if (typeof STYLE !== 'undefined') STYLE.augment(this);
		}

		/**
		 * 紙を強化する（ライブラリ内だけで使用）
		 * @private
		 * @param {HTMLCanvasElement} can キャンバス要素
		 */
		_augment(can) {
			this._prevTime = 0;
			this._deltaTime = 0;
			this._frame = 0;
			this._fps = 60;
			this._frameLength = 60;
			this._totalFrame = 0;
			this._isAnimating = false;
			this._isGridVisible = true;

			this._keyEventHandler = new KeyHandler(can);
			this._mouseEventHandler = new MouseHandler(can);
			this._zoomHandler = new ZoomHandler(this);
			this._transforms = [];
			this._stackLevel = 0;
			this.addEventListener = can.addEventListener.bind(can);

			can.addEventListener('keydown', (e) => {
				if (e.ctrlKey && String.fromCharCode(e.keyCode) === 'S') this.saveImage();
			}, true);
		}

		/**
		 * 横の大きさ
		 * @param {number=} val 横の大きさ
		 * @return {number|Paper} 横の大きさ／この紙
		 */
		width(val) {
			if (val === undefined) return this.canvas.width;
			this.canvas.width = val;
			return this;
		}

		/**
		 * たての大きさ
		 * @param {number=} val たての大きさ
		 * @return {number|Paper} たての大きさ／この紙
		 */
		height(val) {
			if (val === undefined) return this.canvas.height;
			this.canvas.height = val;
			return this;
		}

		/**
		 * 紙のサイズを変える
		 * @param {number} width 横の大きさ
		 * @param {number} height たての大きさ
		 * @return {Paper} この紙
		 */
		setSize(width, height) {
			this.canvas.width = width;
			this.canvas.height = height;
			return this;
		}

		/**
		 * 紙を指定した色でクリアする
		 * @param {string} style スタイル（指定しなければ透明）
		 * @param {number} alpha アルファ
		 * @return {Paper} この紙
		 */
		clear(style, alpha) {
			this.save();
			this._ctx.setTransform(1, 0, 0, 1, 0, 0);
			if (alpha !== undefined) {
				this.globalAlpha = alpha;
			}
			if (style === undefined) {
				this.clearRect(0, 0, this.width(), this.height());  // 透明にする
			} else {
				this.fillStyle = style;
				this.fillRect(0, 0, this.width(), this.height());
			}
			this.restore();
			return this;
		}

		/**
		 * ピクセルの色を取得する
		 * @param {number} x x座標
		 * @param {number} y y座標
		 * @return {number[]} 色（RGBA）を表す配列
		 */
		getPixel(x, y) {
			return this.getImageData(x, y, 1, 1).data;
		}

		/**
		 * ピクセルの色を設定する
		 * @param {number} x x座標
		 * @param {number} y y座標
		 * @param {number[]} rgba 色（RGBA）を表す配列
		 * @return {Paper} この紙
		 */
		setPixel(x, y, [r = 0, g = 0, b = 0, a = 255]) {
			this.save();
			this.strokeStyle = `rgba(${r},${g},${b},${a})`;
			this.beginPath();
			this.rect(x, y, 1, 1);
			this.stroke();
			this.restore();
			return this;
		}


		// アニメーション -------------------------------------------------------


		/**
		 * アニメーションを始める
		 * @param {function} drawingCallback 一枚一枚の絵を書く関数
		 * @param {Array} args_array 関数に渡す引数
		 * @return {Paper} この紙
		 */
		animate(drawingCallback, args_array) {
			const startTime = now();
			let prevFrame = -1;

			const loop = () => {
				const time = now();
				this._deltaTime = time - this._prevTime;
				const timeSpan = time - startTime;
				const frame = Math.floor(timeSpan / (1000.0 / this._fps)) % this._frameLength;

				if (frame !== prevFrame) {
					this._frame = frame;
					CROQUJS.currentPaper(this);
					this._transforms.length = 0;
					this._zoomHandler.beforeDrawing(this._ctx);
					drawingCallback(...args_array);
					if (this.mouseMiddle() && this._isGridVisible) this.drawGrid();
					this._zoomHandler.afterDrawing(this._ctx);
					if (this._zoomHandler.enabled()) {
						for (const t of this._transforms) t();
					}
					prevFrame = frame;
					this._totalFrame += 1;
				}
				if (this._isAnimating && this.canvas.parentNode !== null) {
					window.requestAnimationFrame(loop);
				}
				this._prevTime = time;
			};
			this._isAnimating = true;
			window.requestAnimationFrame(loop);
			return this;
		}

		/**
		 * アニメーションを止める
		 * @return {Paper} この紙
		 */
		stop() {
			this._isAnimating = false;
			return this;
		}

		/**
		 * 時間差（前回のフレームからの時間経過）[ms]
		 * @return {number} 時間差
		 */
		deltaTime() {
			return this._deltaTime;
		}

		/**
		 * フレーム
		 * @return {number} フレーム
		 */
		frame() {
			return this._frame;
		}

		/**
		 * FPS（1秒間のコマ数）
		 * @param {number=} val FPS（1秒間のコマ数）
		 * @return {number|Paper} FPS（1秒間のコマ数）／この紙
		 */
		fps(val) {
			if (val === undefined) return this._fps;
			this._fps = val;
			return this;
		}

		/**
		 * フレーム長
		 * @param {number=} val フレーム長
		 * @return {number|Paper} フレーム長／この紙
		 */
		frameLength(val) {
			if (val === undefined) return this._frameLength;
			this._frameLength = val;
			return this;
		}

		/**
		 * 全フレーム
		 * @return {number} 全フレーム
		 */
		totalFrame() {
			return this._totalFrame;
		}


		// 変換 -----------------------------------------------------------------


		/**
		 * 今の状態を保存する
		 */
		save() {
			this._ctx.save();
			this._stackLevel += 1;
		}

		/**
		 * 前の状態を復元する
		 */
		restore() {
			this._ctx.restore();
			this._stackLevel -= 1;
		}

		/**
		 * 拡大・縮小する
		 * @param {number} x 横方向の倍率
		 * @param {number} y たて方向の倍率
		 */
		scale(x, y) {
			this._ctx.scale(x, y);
			if (this._stackLevel === 0 && this._zoomHandler.enabled()) this._transforms.push(() => this._ctx.scale(x, y));
		}

		/**
		 * 回転する
		 * @param {number} angle ラジアン
		 */
		rotate(angle) {
			this._ctx.rotate(angle);
			if (this._stackLevel === 0 && this._zoomHandler.enabled()) this._transforms.push(() => this._ctx.rotate(angle));
		}

		/**
		 * 平行移動する
		 * @param {number} x 横方向の移動
		 * @param {number} y たて方向の移動
		 */
		translate(x, y) {
			this._ctx.translate(x, y);
			if (this._stackLevel === 0 && this._zoomHandler.enabled()) this._transforms.push(() => this._ctx.translate(x, y));
		}

		/**
		 * 変形する
		 * @param {number} a 変形行列の係数a
		 * @param {number} b 変形行列の係数b
		 * @param {number} c 変形行列の係数c
		 * @param {number} d 変形行列の係数d
		 * @param {number} e 変形行列の係数e
		 * @param {number} f 変形行列の係数f
		 */
		transform(a, b, c, d, e, f) {
			this._ctx.transform(a, b, c, d, e, f);
			if (this._stackLevel === 0 && this._zoomHandler.enabled()) this._transforms.push(() => this._ctx.transform(a, b, c, d, e, f));
		}

		/**
		 * 変形行列をセットする
		 * @param {number} a 変形行列の係数a
		 * @param {number} b 変形行列の係数b
		 * @param {number} c 変形行列の係数c
		 * @param {number} d 変形行列の係数d
		 * @param {number} e 変形行列の係数e
		 * @param {number} f 変形行列の係数f
		 */
		setTransform(a, b, c, d, e, f) {
			this._ctx.setTransform(a, b, c, d, e, f);
			if (this._stackLevel === 0 && this._zoomHandler.enabled()) this._transforms.push(() => this._ctx.setTransform(a, b, c, d, e, f));
		}

		/**
		 * 変形行列をリセットする
		 */
		resetTransform() {
			this._ctx.resetTransform();
			if (this._stackLevel === 0 && this._zoomHandler.enabled()) this._transforms.push(() => this._ctx.resetTransform());
		}


		// ページ ---------------------------------------------------------------


		/**
		 * 新しいページを作る
		 * @param {string} pageName ページの名前
		 * @return {Paper} ページ
		 */
		makePage(pageName) {
			if (!this._pages) this._pages = {};
			this._pages[pageName] = new CROQUJS.Paper(this.width(), this.height(), false);
			return this._pages[pageName];
		}

		/**
		 * ページをもらう
		 * @param {string} pageName ページの名前
		 * @return {Paper|boolean} ページ／false
		 */
		getPage(pageName) {
			if (!this._pages) return false;
			return this._pages[pageName];
		}


		// 子の紙 ---------------------------------------------------------------


		/**
		 * 子の紙を追加する
		 * @param {Paper} paper 子の紙
		 */
		addChild(paper) {
			if (!this._children) this._children = [];
			this._children.push(paper);
			this._mouseEventHandler.addChild(paper._mouseEventHandler);
		}

		/**
		 * 子の紙を削除する
		 * @param {Paper} paper 子の紙
		 */
		removeChild(paper) {
			if (!this._children) return;
			this._children = this._children.filter(e => (e !== paper));
			this._mouseEventHandler.removeChild(paper._mouseEventHandler);
		}


		// ユーティリティ -------------------------------------------------------


		/**
		 * 定規をもらう
		 * @return {Ruler} 定規
		 */
		getRuler() {
			if (typeof RULER === 'undefined') throw new Error('Rulerライブラリが必要です。');
			if (!this._ruler) this._ruler = new RULER.Ruler(this);
			return this._ruler;
		}

		/**
		 * 紙にかいた絵をファイルに保存する
		 * @param {string=} fileName ファイル名
		 * @param {string=} type ファイルの種類
		 * @return {Paper} この紙
		 */
		saveImage(fileName, type) {
			const canvasToBlob = function (canvas, type) {
				const data = atob(canvas.toDataURL(type).split(',')[1]);
				const buf = new Uint8Array(data.length);

				for (let i = 0, I = data.length; i < I; i += 1) {
					buf[i] = data.charCodeAt(i);
				}
				return new Blob([buf], { type: type || 'image/png' });
			};
			const saveBlob = function (blob, fileName) {
				const a = document.createElement('a');
				a.href = window.URL.createObjectURL(blob);
				a.download = fileName;
				a.click();
			};
			saveBlob(canvasToBlob(this.canvas, type), fileName || 'default.png');
			return this;
		}


		/**
		 * ホイールクリックでグリッドを表示するか
		 * @param {boolean=} val ホイールクリックでグリッドを表示するか
		 * @return {boolean|Paper} ホイールクリックでグリッドを表示するか／この紙
		 */
		gridVisible(val) {
			if (val === undefined) return this._isGridVisible;
			this._isGridVisible = val;
			return this;
		}

		/**
		 * 紙にマス目をかく
		 */
		drawGrid() {
			const w = this.width(), h = this.height();
			const wd = Math.floor(w / 10), hd = Math.floor(h / 10);

			this.save();
			this.lineWidth = 1;
			this.strokeStyle = 'White';
			this.globalCompositeOperation = 'xor';

			for (let x = -wd; x < wd; x += 1) {
				this.globalAlpha = (x % 10 === 0) ? 0.75 : 0.5;
				this.beginPath();
				this.moveTo(x * 10, -h);
				this.lineTo(x * 10, h);
				this.stroke();
			}
			for (let y = -hd; y < hd; y += 1) {
				this.globalAlpha = (y % 10 === 0) ? 0.75 : 0.5;
				this.beginPath();
				this.moveTo(-w, y * 10);
				this.lineTo(w, y * 10);
				this.stroke();
			}
			this.restore();
		}

		/**
		 * ホイール回転でズームするか
		 * @param {boolean=} val ホイール回転でズームするか
		 * @return {boolean|Paper} ホイール回転でズームするか／この紙
		 */
		zoomEnabled(val) {
			if (val === undefined) return this._zoomHandler.enabled();
			this._zoomHandler.enabled(val);
			return this;
		}


		// キーボード -----------------------------------------------------------


		/**
		 * キー・ダウン（キーが押された）イベントに対応する関数をセットする
		 * @param {function(string, KeyboardEvent):void=} handler 関数
		 * @return {function(string, KeyboardEvent):void|Paper} 関数／この紙
		 */
		onKeyDown(handler) {
			if (handler === undefined) return this._keyEventHandler.onKeyDown();
			this._keyEventHandler.onKeyDown(handler);
			return this;
		}

		/**
		 * キー・アップ（キーが離された）イベントに対応する関数をセットする
		 * @param {function(string, KeyboardEvent):void=} handler 関数
		 * @return {function(string, KeyboardEvent):void|Paper} 関数／この紙
		 */
		onKeyUp(handler) {
			if (handler === undefined) return this._keyEventHandler.onKeyUp();
			this._keyEventHandler.onKeyUp(handler);
			return this;
		}

		/**
		 * カーソル・キーの左が押されているか？
		 * @return {boolean} カーソル・キーの左が押されているか
		 */
		keyArrowLeft() {
			return this._keyEventHandler.keyArrowLeft();
		}

		/**
		 * カーソル・キーの上が押されているか？
		 * @return {boolean} カーソル・キーの上が押されているか
		 */
		keyArrowUp() {
			return this._keyEventHandler.keyArrowUp();
		}

		/**
		 * カーソル・キーの右が押されているか？
		 * @return {boolean} カーソル・キーの右が押されているか
		 */
		keyArrowRight() {
			return this._keyEventHandler.keyArrowRight();
		}

		/**
		 * カーソル・キーの下が押されているか？
		 * @return {boolean} カーソル・キーの下が押されているか
		 */
		keyArrowDown() {
			return this._keyEventHandler.keyArrowDown();
		}


		// マウス ---------------------------------------------------------------


		/**
		 * マウス・ダウン（ボタンが押された）イベントに対応する関数をセットする
		 * @param {function(number, number, MouseEvent):void=} handler 関数
		 * @return {function(number, number, MouseEvent):void|Paper} 関数／この紙
		 */
		onMouseDown(handler) {
			if (handler === undefined) return this._mouseEventHandler.onMouseDown();
			this._mouseEventHandler.onMouseDown(handler);
			return this;
		}

		/**
		 * マウス・ムーブ（ポインターが移動した）イベントに対応する関数をセットする
		 * @param {function(number, number, MouseEvent):void=} handler 関数
		 * @return {function(number, number, MouseEvent):void|Paper} 関数／この紙
		 */
		onMouseMove(handler) {
			if (handler === undefined) return this._mouseEventHandler.onMouseMove();
			this._mouseEventHandler.onMouseMove(handler);
			return this;
		}

		/**
		 * マウス・アップ（ボタンが離された）イベントに対応する関数をセットする
		 * @param {function(number, number, MouseEvent):void=} handler 関数
		 * @return {function(number, number, MouseEvent):void|Paper} 関数／この紙
		 */
		onMouseUp(handler) {
			if (handler === undefined) return this._mouseEventHandler.onMouseUp();
			this._mouseEventHandler.onMouseUp(handler);
			return this;
		}

		/**
		 * マウス・クリック・イベントに対応する関数をセットする
		 * @param {function(number, number, MouseEvent):void=} handler 関数
		 * @return {function(number, number, MouseEvent):void|Paper} 関数／この紙
		 */
		onMouseClick(handler) {
			if (handler === undefined) return this._mouseEventHandler.onMouseClick();
			this._mouseEventHandler.onMouseClick(handler);
			return this;
		}

		/**
		 * マウス・ホイール・イベントに対応する関数をセットする
		 * @param {function(number, WheelEvent):void=} handler 関数
		 * @return {function(number, WheelEvent):void|Paper} 関数／この紙
		 */
		onMouseWheel(handler) {
			if (handler === undefined) return this._mouseEventHandler.onMouseWheel();
			this._mouseEventHandler.onMouseWheel(handler);
			return this;
		}

		/**
		 * マウスの横の場所を返す
		 * @return {number} マウスの横の場所
		 */
		mouseX() {
			return this._mouseEventHandler.mouseX();
		}

		/**
		 * マウスのたての場所を返す
		 * @return {number} マウスのたての場所
		 */
		mouseY() {
			return this._mouseEventHandler.mouseY();
		}

		/**
		 * マウスの左ボタンが押されているか？
		 * @return {boolean} マウスの左ボタンが押されているか
		 */
		mouseLeft() {
			return this._mouseEventHandler.mouseLeft();
		}

		/**
		 * マウスの右ボタンが押されているか？
		 * @return {boolean} マウスの右ボタンが押されているか
		 */
		mouseRight() {
			return this._mouseEventHandler.mouseRight();
		}

		/**
		 * マウスの中ボタンが押されているか？
		 * @return {boolean} マウスの中ボタンが押されているか
		 */
		mouseMiddle() {
			return this._mouseEventHandler.mouseMiddle();
		}

	};

	let PAPER_IS_AUGMENTED = false;

	function augmentPaperPrototype(ctx) {
		PAPER_IS_AUGMENTED = true;
		const org = Object.getPrototypeOf(ctx);
		for (const name in ctx) {
			if (typeof ctx[name] === 'function') {
				if (Paper.prototype[name]) continue;
				Paper.prototype[name] = function (...args) { return this._ctx[name](...args); }
			} else {
				const d = Object.getOwnPropertyDescriptor(org, name);
				const nd = { configurable: d.configurable, enumerable: d.enumerable }
				if (d.get) nd['get'] = function () { return this._ctx[name]; };
				if (d.set) nd['set'] = function (v) { this._ctx[name] = v; };
				Object.defineProperty(Paper.prototype, name, nd);
			}
		}
	}


	// ユーティリティ関数 ------------------------------------------------------


	/**
	 * 今のミリ秒を得る
	 * @return {number} 今のミリ秒
	 */
	const now = function () {
		return window.performance.now();
	};

	/**
	 * 例外を除き画面上の要素をすべて削除する
	 * @param {...HTMLElement} exception 例外の要素
	 */
	const removeAll = function (...exception) {
		let ex = [];
		if (exception.length === 1 && Array.isArray(exception[0])) {
			ex = exception[0];
		} else {
			ex = exception;
		}
		ex = ex.map((e) => {return (e.domElement === undefined) ? e : e.domElement();});

		const rm = [];
		for (const c of document.body.childNodes) {
			if (ex.indexOf(c) === -1) rm.push(c);
		}
		rm.forEach((e) => {
			if (CANVAS_TO_PAPER[e]) {
				CANVAS_TO_PAPER[e]._mouseEventHandler.removeWinListener();
			}
			document.body.removeChild(e);
		});
	};

	/**
	 * 現在の紙
	 * @param {Paper=} paper 紙
	 * @return {Paper} 現在の紙
	 */
	const currentPaper = function (paper) {
		if (paper) CROQUJS._currentPaper = paper;
		return CROQUJS._currentPaper;
	};


	/**
	 * スクリプトの読み込み
	 * @author Takuto Yanagida
	 * @version 2020-04-24
	 */


	/**
	 * スクリプトを読み込む（非同期）
	 * @param {string} src スクリプトのURL
	 */
	function loadScript(src) {
		const s = document.createElement('script');
		s.src = src;
		document.head.appendChild(s);
	}

	/**
	 * スクリプトを読み込む（同期）
	 * @param {string} src スクリプトのURL
	 */
	function loadScriptSync(src) {
		const xhr = new XMLHttpRequest();
		xhr.open('GET', src, false);
		xhr.send(null);
		if (xhr.status === 200) {
			const s = document.createElement('script');
			s.text = xhr.responseText;
			document.head.appendChild(s);
		}
	}


	// ライブラリを作る --------------------------------------------------------


	return { Paper, now, removeAll, currentPaper, loadScript, loadScriptSync };

}());