/**
 * スプライト・ライブラリ（SPRITE）
 *
 * スプライト（アニメのセル画のようなもの）を作って、
 * 好きな場所に好きな大きさ、向き、透明度で表示するためのライブラリです。
 *
 * @author Takuto Yanagida
 * @version 2021-02-06
 */


/**
 * ライブラリ変数
 */
const SPRITE = (function () {

	'use strict';


	// ライブラリ中だけで使用するユーティリティ --------------------------------


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
	 * 値ならそのまま返し、関数なら関数を呼び出す
	 * @param {number|function():number} vf 値か関数
	 * @return {number} 値
	 */
	const valueFunction = function (vf) {
		if (typeof vf === 'function') {
			return vf();
		} else {
			return vf;
		}
	};

	/**
	 * 範囲をチェックする関数を作る
	 * @param {number} min 最小値
	 * @param {number} max 最大値
	 * @param {boolean=} isLoop ループする？
	 * @return {function(number):number} 範囲をチェックする関数
	 */
	const makeRangeChecker = function (min, max, isLoop) {
		if (isLoop) {
			return function (v) {
				if (v < min) return max;
				if (max < v) return min;
				return v;
			}
		} else {
			return function (v) {
				if (v < min) return min;
				if (max < v) return max;
				return v;
			}
		}
	};


	/**
	 * 要素（スプライト・ステージ共通）
	 * @version 2021-05-21
	 */
	class Element {

		/**
		 * 要素を作る
		 * @constructor
		 * @param {Motion|function=} [motion=null] 動き
		 * @param {Rotation|function=} [rotation=null] 回転
		 */
		constructor(motion = null, rotation = null) {
			this._parent    = null;
			this._data      = null;
			this._observers = null;

			this._x   = 0;
			this._y   = 0;
			this._dir = 0;

			this._scale = 1;
			this._alpha = 1;
			this._isFixedHeading = false;

			this._angle  = 0;
			this._angleX = 0;
			this._angleZ = 0;

			this._speed = 1;

			this._checkRangeX = null;
			this._checkRangeY = null;

			this._motion   = motion;
			this._rotation = rotation;
		}

		/**
		 * x座標
		 * @param {number=} val x座標の値
		 * @return {number|Element} x座標の値／この要素
		 */
		x(val) {
			if (val === undefined) return this._x;
			this._x = val;
			return this;
		}

		/**
		 * y座標
		 * @param {number=} val y座標の値
		 * @return {number|Element} y座標の値／この要素
		 */
		y(val) {
			if (val === undefined) return this._y;
			this._y = val;
			return this;
		}

		/**
		 * 方向
		 * @param {number=} deg 角度の値
		 * @return {number|Element} 角度の値／この要素
		 */
		direction(deg) {
			if (deg === undefined) return this._dir;
			this._dir = checkDegRange(deg);
			return this;
		}

		/**
		 * 移動する
		 * @param {number} x x座標
		 * @param {number} y y座標
		 * @param {number=} opt_dir 方向（オプション）
		 * @return {Element} この要素
		 */
		moveTo(x, y, opt_dir) {
			this._x = x;
			this._y = y;
			if (opt_dir !== undefined) this._dir = checkDegRange(opt_dir);
			return this;
		}

		/**
		 * スケール
		 * @param {number|number[]=} val スケールの値
		 * @return {number|number[]|Element} スケールの値／この要素
		 */
		scale(val) {
			if (val === undefined) return this._scale;
			this._scale = val;
			return this;
		}

		/**
		 * アルファ
		 * @param {number=} val アルファの値
		 * @return {number|Element} アルファの値／この要素
		 */
		alpha(val) {
			if (val === undefined) return this._alpha;
			this._alpha = val;
			return this;
		}

		/**
		 * z軸を中心とする角度（向き）
		 * @param {number=} val 角度の値
		 * @return {number|Element} 角度の値／この要素
		 */
		angle(val) {
			if (val === undefined) return this._angle;
			this._angle = val;
			return this;
		}

		/**
		 * x軸を中心とする角度（向き）
		 * @param {number=} val 角度の値
		 * @return {number|Element} 角度の値／この要素
		 */
		angleX(val) {
			if (val === undefined) return this._angleX;
			this._angleX = val;
			return this;
		}

		/**
		 * z軸を中心とする角度2（向き）
		 * @param {number=} val 角度の値
		 * @return {number|Element} 角度の値／この要素
		 */
		angleZ(val) {
			if (val === undefined) return this._angleZ;
			this._angleZ = val;
			return this;
		}

		/**
		 * 絵をかく方向を向きと関係なく固定するか？
		 * @param {boolean=} val 値
		 * @return {boolean|Element} 値／この要素
		 */
		fixedHeading(val) {
			if (val === undefined) return this._isFixedHeading;
			this._isFixedHeading = val;
			return this;
		}

		/**
		 * スピード
		 * @param {number=} val スピード
		 * @return {number|Element} スピード／この要素
		 */
		speed(val) {
			if (val === undefined) return this._speed;
			this._speed = val;
			return this;
		}

		/**
		 * 横方向の範囲をセットする
		 * @param {number} min 始まり
		 * @param {number} max 終わり
		 * @param {boolean} isLoop ループする？
		 */
		setRangeX(min, max, isLoop) {
			this._checkRangeX = makeRangeChecker(min, max, isLoop);
		}

		/**
		 * たて方向の範囲をセットする
		 * @param {number} min 始まり
		 * @param {number} max 終わり
		 * @param {boolean} isLoop ループする？
		 */
		setRangeY(min, max, isLoop) {
			this._checkRangeY = makeRangeChecker(min, max, isLoop);
		}

		/**
		 * 更新前イベントに対応する関数をセットする
		 * @param {function(Element):void} handler 関数
		 * @return {function(Element):void=} 関数
		 */
		onBeforeUpdate(handler) {
			if (handler === undefined) return this._onBeforeUpdate;
			this._onBeforeUpdate = handler;
		}

		/**
		 * 更新イベントに対応する関数をセットする
		 * @param {function(Element):void} handler 関数
		 * @return {function(Element):void=} 関数
		 */
		onUpdate(handler) {
			if (handler === undefined) return this._onUpdate;
			this._onUpdate = handler;
		}

		/**
		 * 動き
		 * @param {Motion|function=} val 動き
		 * @return {Motion|Element} 動き／この要素
		 */
		motion(val) {
			if (val === undefined) return this._motion;
			this._motion = val;
			return this;
		}

		/**
		 * 回転
		 * @param {Rotation|function=} val 回転
		 * @return {Rotation|function|Element} 回転／この要素
		 */
		rotation(val) {
			if (val === undefined) return this._rotation;
			this._rotation = val;
			return this;
		}

		/**
		 * データ
		 * @param {object=} val データ
		 * @return {object|Element} データ／この要素
		 */
		data(val) {
			if (val === undefined) return this._data;
			this._data = val;
			return this;
		}

		/**
		 * 紙の座標変換とアルファ値をセットする（ライブラリ内だけで使用）
		 * @protected
		 * @param {Paper|CanvasRenderingContext2D} ctx 紙／キャンバス・コンテキスト
		 */
		_setTransformation(ctx) {
			ctx.translate(this._x, this._y);
			if (!this._isFixedHeading) {
				ctx.rotate(this._dir * Math.PI / 180.0);
			}
			// 下ではスプライトを、Z軸中心にangle度回転、X軸を中心にangleX度回転、さらにもう一度Z軸を中心にangleZ度回転させている
			// 角度をラジアンに変換して回転（ラジアン = 角度 ✕ π / 180）
			ctx.rotate(this._angleZ * Math.PI / 180);
			ctx.scale(1.0, Math.cos(this._angleX * Math.PI / 180));
			ctx.rotate(this._angle * Math.PI / 180);
			// ※Z-X-Zのオイラー角に対応

			if (Array.isArray(this._scale)) {
				ctx.scale(this._scale[0], this._scale[1]);
			} else {
				ctx.scale(this._scale, this._scale);
			}
			ctx.globalAlpha *= this._alpha;
		}

		/**
		 * スピードに合わせて座標と角度を更新する（ライブラリ内だけで使用）
		 * @protected
		 * @param {number} deltaTime 時間差（前回のフレームからの時間経過）[ms]
		 */
		_update(deltaTime) {
			// 更新前イベント
			if (this._onBeforeUpdate) this._onBeforeUpdate(this);

			if (this._rotation !== null) {
				let newAs = null;
				if (typeof this._rotation === 'function') {
					newAs = this._rotation(this, this._speed * deltaTime, this._angle, this._angleX, this._angleZ);
				} else {
					newAs = this._rotation.update(this._speed * deltaTime, this._angle, this._angleX, this._angleZ);
				}
				[this._angle, this._angleX, this._angleZ] = newAs;
			}
			if (this._motion !== null) {
				let newPos = null;
				if (typeof this._motion === 'function') {
					newPos = this._motion(this, this._speed * deltaTime, this._x, this._y, this._dir);
				} else {
					newPos = this._motion.update(this._speed * deltaTime, this._x, this._y, this._dir);
				}
				if (newPos.length === 2) newPos.push(this._dir);
				[this._x, this._y, this._dir] = newPos;
			}
			if (this._checkRangeX !== null) this._x = this._checkRangeX(this._x);
			if (this._checkRangeY !== null) this._y = this._checkRangeY(this._y);

			if (this._observers) {
				for (const o of this._observers) {
					o.update(this);
				}
			}

			// 更新後イベント
			if (this._onUpdate) this._onUpdate(this);
			// 最初にこの関数が呼ばれ、座標などが正しいことを示す
			this._firstUpdated = true;
		}

	}


	/**
	 * スプライト
	 * @extends {Element}
	 * @version 2021-07-30
	 */
	class Sprite extends Element {

		/**
		 * スプライトを作る
		 * @constructor
		 * @param {function(*):void} drawingCallback 絵をかく関数
		 * @param {Motion|function=} [motion=null] 動き
		 * @param {Rotation|function=} [rotation=null] 回転
		 */
		constructor(drawingCallback, motion = null, rotation = null) {
			super(motion, rotation);
			this._drawingCallback = drawingCallback;
			this._collisionRadius = 1;
			this._onCollision = null;
		}

		/**
		 * スプライトをかく
		 * @param {Paper|CanvasRenderingContext2D} ctx 紙／キャンバス・コンテキスト
		 * @param {Array=} args_array その他の引数の配列
		 */
		draw(ctx, args_array = []) {
			if (!this._firstUpdated) this._update(0);

			ctx.save();
			this._setTransformation(ctx);
			this._drawingCallback.apply(this, args_array);
			ctx.restore();
		}

		/**
		 * 衝突半径
		 * @param {number=} val 半径
		 * @return {number|Sprite} 半径／このスプライト
		 */
		collisionRadius(val) {
			if (val === undefined) return this._collisionRadius;
			this._collisionRadius = val;
			return this;
		}

		/**
		 * 衝突イベントに対応する関数をセットする
		 * @param {function(Sprite, Sprite):void=} handler 関数
		 * @return {function(Sprite, Sprite):void|Sprite=} 半径／このスプライト
		 */
		onCollision(handler) {
			if (handler === undefined) return this._onCollision;
			this._onCollision = handler;
			return this;
		}

	}


	/**
	 * スプライト図形（ライブラリ内だけで使用）
	 * @private
	 * @extends {Sprite}
	 * @version 2021-05-21
	 */
	class SpriteShape extends Sprite {

		/**
		 * スプライト図形を作る
		 * @constructor
		 */
		constructor() {
			super(null);
			if (typeof RULER === 'undefined') throw new Error('Rulerライブラリが必要です。');
			this._ruler = new RULER.Ruler();
		}

		/**
		 * 定規
		 * @return {Ruler} 定規
		 */
		ruler() {
			return this._ruler;
		}

		/**
		 * スプライトをかく
		 * @override
		 * @param {Paper|CanvasRenderingContext2D} ctx 紙／キャンバス・コンテキスト
		 */
		draw(ctx) {
			if (this._firstUpdated) {
				ctx.save();
				this._setTransformation(ctx);
				this._drawingCallback.call(this, ctx);
				ctx.restore();
			}
		}

	}

	/**
	 * 円スプライト
	 * @extends {SpriteShape}
	 * @version 2021-05-21
	 */
	class Circle extends SpriteShape {

		/**
		 * 円形スプライトを作る
		 * @constructor
		 * @param {number=} radius 半径
		 */
		constructor(radius = 10) {
			super();
			this._drawingCallback = this._draw.bind(this);
			this._collisionRadius = radius;
			this._radius = radius;
		}

		/**
		 * 円をかく（ライブラリ内だけで使用）
		 * @private
		 * @param {Paper|CanvasRenderingContext2D} ctx 紙／キャンバス・コンテキスト
		 */
		_draw(ctx) {
			if (!this._ruler.context()) this._ruler.context(ctx);
			this._ruler.circle(0, 0, this._radius);
			this._ruler.draw('fs');
		}

		/**
		 * 半径
		 * @param {number=} val 半径
		 * @return {number|Circle} 半径／このスプライト
		 */
		radius(val) {
			if (val === undefined) return this._radius;
			this._radius = val;
			this._collisionRadius = val;
			return this;
		}

	}

	/**
	 * 四角形スプライト
	 * @extends {SpriteShape}
	 * @version 2021-05-21
	 */
	class Rect extends SpriteShape {

		/**
		 * 四角形スプライトを作る
		 * @constructor
		 * @param {number=} width 横幅
		 * @param {number=} height たて幅
		 */
		constructor(width = 20, height = 20) {
			super();
			this._drawingCallback = this._draw.bind(this);
			this._collisionRadius = Math.min(width, height);
			this._width = width;
			this._height = height;
		}

		/**
		 * 四角形をかく（ライブラリ内だけで使用）
		 * @private
		 * @param {Paper|CanvasRenderingContext2D} ctx 紙／キャンバス・コンテキスト
		 */
		_draw(ctx) {
			if (!this._ruler.context()) this._ruler.context(ctx);
			this._ruler.rect(0, 0, this._width, this._height);
			this._ruler.draw('fs');
		}

		/**
		 * 横幅
		 * @param {number=} val 横幅
		 * @return {number|Rect} 横幅／このスプライト
		 */
		width(val) {
			if (val === undefined) return this._width;
			this._width = val;
			this._collisionRadius = Math.min(this._width, this._height);
			return this;
		}

		/**
		 * たて幅
		 * @param {number=} val たて幅
		 * @return {number|Rect} たて幅／このスプライト
		 */
		height(val) {
			if (val === undefined) return this._height;
			this._height = val;
			this._collisionRadius = Math.min(this._width, this._height);
			return this;
		}

	}


	/**
	 * ステージ
	 * @extends {Element}
	 * @version 2021-07-28
	 */
	class Stage extends Element {

		/**
		 * ステージを作る
		 * @constructor
		 * @param {Motion|function=} [motion=null] 動き
		 * @param {Rotation|function=} [rotation=null] 回転
		 */
		constructor(motion = null, rotation = null) {
			super(motion, rotation);

			this._children = [];

			this._localizeOption = null;
			this._localizedOffset = [0, 0, 0];

			this._update(0);
		}

		/**
		 * スプライトを作って加える
		 * @param {function(*):void} drawFunction 絵をかく関数
		 * @param {Motion|function=} [motion=null] 動き
		 * @param {Rotation|function=} [rotation=null] 回転
		 * @return {Sprite} スプライト
		 */
		makeSprite(drawFunction, motion = null, rotation = null) {
			const s = new SPRITE.Sprite(drawFunction, motion, rotation);
			this.add(s);
			return s;
		}

		/**
		 * ステージを作って加える
		 * @return {Stage} ステージ
		 */
		makeStage() {
			const l = new SPRITE.Stage();
			this.add(l);
			return l;
		}

		/**
		 * スプライトか子ステージを加える
		 * @param {Element} child スプライトか子ステージ
		 */
		add(child) {
			this._children.push(child);
			child._parent = this;
		}

		/**
		 * スプライトか子ステージを返す
		 * @param {number} index 何番目か
		 * @return {Element} スプライトか子ステージ
		 */
		get(index) {
			return this._children[index];
		}

		/**
		 * 何枚のスプライトか子ステージを持っているか、数を返す
		 * @return {number} 数
		 */
		size() {
			return this._children.length;
		}

		/**
		 * 持っているスプライトと子ステージに対して処理をする
		 * @param {function} callback 処理をする関数
		 * @param {*} thisArg This引数
		 */
		forEach(callback, thisArg) {
			for (let i = 0; i < this._children.length; i += 1) {
				const c = this._children[i];
				callback.call(thisArg, c, i, this);
			}
		}

		/**
		 * 指定したスプライトを固定して表示する
		 * @param {Element} descendant スプライトかステージ
		 * @param {boolean=} opt_stopRotation 回転を止めるか
		 */
		localize(descendant, opt_stopRotation) {
			this._localizeOption = [descendant, opt_stopRotation];
		}

		/**
		 * 指定したスプライトを固定して表示する（ライブラリ内だけで使用）
		 * @private
		 */
		_localize() {
			if (this._localizeOption) {
				const [descendant, opt_stopRotation] = this._localizeOption;
				const off = this._getPositionOnParent(descendant, 0, 0, 0, opt_stopRotation);
				this._localizedOffset[0] = -off[0];
				this._localizedOffset[1] = -off[1];
				this._localizedOffset[2] = -off[2];
			} else {
				this._localizedOffset[0] = 0;
				this._localizedOffset[1] = 0;
				this._localizedOffset[2] = 0;
			}
		}

		/**
		 * このステージの原点の紙での場所を返す
		 * @param {Element} descendant スプライトかステージ
		 * @return {number[]} 場所
		 */
		getPositionOnContext(descendant) {
			let [x, y] = this._getPositionOnParent(descendant, 0, 0, 0);
			x += this._localizedOffset[0];
			y += this._localizedOffset[1];

			const r = this._localizedOffset[2] * Math.PI / 180;
			const sin = Math.sin(r);
			const cos = Math.cos(r);
			const nx = (x * cos - y * sin);
			const ny = (x * sin + y * cos);
			return [nx, ny];
		}

		/**
		 * 持っているスプライトと子ステージを全てかく
		 * @param {Paper|CanvasRenderingContext2D} ctx 紙／キャンバス・コンテキスト
		 * @param {Array=} args_array その他の引数の配列
		 */
		draw(ctx, args_array = []) {
			ctx.save();

			this._localize();
			ctx.rotate(this._localizedOffset[2] * Math.PI / 180);
			ctx.translate(this._localizedOffset[0], this._localizedOffset[1]);
			this._setTransformation(ctx);

			for (const c of this._children) {
				// スプライトのdraw関数を呼び出す
				c.draw(ctx, args_array);
			}
			ctx.restore();
		}

		/**
		 * 時間に合わせて持っているスプライトと子ステージを全て更新する
		 * @param {number=} deltaTime 時間差（前回のフレームからの時間経過）[ms]
		 */
		update(deltaTime = 1) {
			for (const c of this._children) {
				// スプライトの_update関数を呼び出す
				c._update(deltaTime);
			}
			this._update(deltaTime);
			this._checkCollision();
		}

		/**
		 * ある要素の原点の紙での場所を返す（ライブラリ内だけで使用）
		 * @private
		 * @param {Element} elm スプライトか子ステージ
		 * @param {number} cx 横位置
		 * @param {number} cy たて位置
		 * @param {number} ca 角度
		 * @param {boolean=} opt_stopRotation 回転を止めるか
		 * @return {number[]} 場所
		 */
		_getPositionOnParent(elm, cx, cy, ca, opt_stopRotation) {
			const a = (opt_stopRotation ? elm._angle : 0) + (elm._isFixedHeading ? 0 : elm._dir);
			const r = a * Math.PI / 180;
			const sin = Math.sin(r);
			const cos = Math.cos(r);
			let sx, sy;
			if (Array.isArray(elm._scale)) {
				[sx, sy] = elm._scale;
			} else {
				sx = sy = elm._scale;
			}
			const x = sx * (cx * cos - cy * sin);
			const y = sy * (cx * sin + cy * cos);
			if (elm._parent === null) return [x + elm._x, y + elm._y, a + ca];
			return this._getPositionOnParent(elm._parent, x + elm._x, y + elm._y, a + ca);
		}

		/**
		 * 持っているスプライトが衝突しているかどうかをチェックする（ライブラリ内だけで使用）
		 * @private
		 */
		_checkCollision() {
			for (let i = 0; i < this._children.length; i += 1) {
				const c0 = this._children[i];
				const r0 = c0._collisionRadius;
				const x0 = c0._x;
				const y0 = c0._y;

				for (let j = i + 1; j < this._children.length; j += 1) {
					const c1 = this._children[j];
					if (!c0._onCollision && !c1._onCollision) continue;

					const r1 = c1._collisionRadius;
					const x1 = c1._x;
					const y1 = c1._y;
					const d2 = (x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0);
					const e2 = (r0 + r1) * (r0 + r1);
					if (d2 <= e2) {
						if (c0._onCollision) c0._onCollision(c0, c1);
						if (c1._onCollision) c1._onCollision(c1, c0);
					}
				}
			}
		}

		/**
		 * 観察者（オブザーバー）を加える
		 * @param {*} observer 観察者（オブザーバー）
		 */
		addObserver(observer) {
			if (!this._observers) {
				this._observers = [];
			}
			this._observers.push(observer);
		}

	}
	/**
	 * Symbol.iteratorメソッドを実装して、Stageをイテラブルにする
	 */
	Stage.prototype[Symbol.iterator] = function () {
		return this._children.values();
	};


	/**
	 * 密度マップ
	 * @version 2021-03-01
	 */
	class DensityMap {

		/**
		 * 密度マップを作る
		 * @constructor
		 * @param {number} width 横の大きさ
		 * @param {number} height たての大きさ
		 * @param {number} gridSize マス目の大きさ
		 */
		constructor(width, height, gridSize) {
			this._width    = width;
			this._height   = height;
			this._gridSize = gridSize;

			const dw = width  / gridSize;
			const dh = height / gridSize;
			this._gw = (0 | dw) < dw ? (0 | dw) + 1 : (0 | dw);
			this._gh = (0 | dh) < dh ? (0 | dh) + 1 : (0 | dh);

			this._map = this._makeMap();
		}

		/**
		 * マップを作る（ライブラリ内だけで使用）
		 * @private
		 * @return {number[][]} マップ
		 */
		_makeMap() {
			const m = new Array(this._gh);
			for (let y = 0; y < this._gh; y += 1) m[y] = new Array(this._gw).fill(0);
			return m;
		}

		/**
		 * ステージに合わせてマップを更新する
		 * @param {Stage} stage ステージ
		 */
		update(stage) {
			const m = this._map;
			const gs = this._gridSize;
			stage.forEach((e) => {
				const x = Math.min(Math.max(e.x(), 0), this._width  - 1);
				const y = Math.min(Math.max(e.y(), 0), this._height - 1);
				const dx = 0 | (x / gs);
				const dy = 0 | (y / gs);
				m[dy][dx] += 1;

				const pDx = e._prevDx;
				const pDy = e._prevDy;
				if (pDx !== undefined && pDy !== undefined) m[pDy][pDx] -= 1;
				e._prevDx = dx;
				e._prevDy = dy;
			}, this);
		}

		/**
		 * 密度を求める
		 * @param {number} x x座標
		 * @param {number} y y座標
		 * @param {number} [deg=0] 方向
		 * @param {number} [len=0] 長さ
		 * @return 密度
		 */
		getDensity(x, y, deg = 0, len = 0) {
			if (len === 0) {
				return this._getDensity(x, y);
			}
			[x, y] = this._checkCoordinate(x, y);
			const r = (deg - 90) * Math.PI / 180;
			const sin = Math.sin(r);
			const cos = Math.cos(r);
			const step = 0 | (len * 2 / this._gridSize);
			let sum = 0;
			for (let i = 1; i <= step; i += 1) {
				const r = i * this._gridSize / 2;
				const xx = x + r * cos;
				const yy = y + r * sin;
				sum += this._getDensity(xx, yy);
			}
			return sum;
		}

		/**
		 * 1点の密度を求める（ライブラリ内だけで使用）
		 * @param {number} x x座標
		 * @param {number} y y座標
		 * @return 密度
		 */
		_getDensity(x, y) {
			[x, y] = this._checkCoordinate(x, y);
			const gs = this._gridSize;
			const dx = 0 | (x / gs);
			const dy = 0 | (y / gs);
			return this._map[dy][dx];
		}

		/**
		 * 座標の範囲を調べて正しい範囲の座標を返す（ライブラリ内だけで使用）
		 * @param {number} x x座標
		 * @param {number} y y座標
		 * @return 座標
		 */
		_checkCoordinate(x, y) {
			if (x < 0) x += this._width;
			if (y < 0) y += this._height;
			if (this._width  <= x) x -= this._width;
			if (this._height <= y) y -= this._height;
			x = Math.min(Math.max(x, 0), this._width  - 1);
			y = Math.min(Math.max(y, 0), this._height - 1);
			return [x, y];
		}

		/**
		 * 密度マップをかく
		 * @param {Paper|CanvasRenderingContext2D} ctx 紙／キャンバス・コンテキスト
		 * @param {number} max 最大値
		 */
		draw(ctx, max) {
			const gs = this._gridSize;
			for (let y = 0; y < this._gh; y += 1) {
				for (let x = 0; x < this._gw; x += 1) {
					const d = this._map[y][x];
					ctx.styleFill().alpha(d / max);
					ctx.beginPath();
					ctx.rect(x * gs, y * gs, gs, gs);
					ctx.styleFill().draw();
				}
			}
		}

	}


	// ユーティリティ関数 ------------------------------------------------------


	/**
	 * スプライトの軌跡をプロットする関数を作る
	 * @param {Element} descendant 子孫要素
	 * @param {Stage} ancestorStage 先祖ステージ
	 * @param {Paper|CanvasRenderingContext2D} ctx プロットする紙／キャンバス・コンテキスト
	 * @return {function} スプライトの軌跡をプロットする関数
	 */
	const makePlotFunction = function (descendant, ancestorStage, ctx) {
		let old = [];
		return function () {
			if (!descendant._firstUpdated) return;
			const p = ancestorStage.getPositionOnContext(descendant);
			if (old.length === 2) {
				ctx.beginPath();
				ctx.moveTo(...old);
				ctx.lineTo(...p);
				ctx.stroke();
			}
			old = p;
		};
	};


	// ライブラリを作る --------------------------------------------------------


	return { Stage, Sprite, Circle, Rect, DensityMap, makePlotFunction };

}());
