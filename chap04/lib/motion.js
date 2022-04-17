/**
 * モーション・ライブラリ（MOTION）
 *
 * @author Takuto Yanagida
 * @version 2021-02-05
 */


/**
 * ライブラリ変数
 */
const MOTION = (function () {

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
	 * 値なら返し、関数なら関数を呼び出す
	 * @param {number|function():number} vf 値か関数
	 * @param {number=} unitTime 単位時間
	 * @return {number} 値
	 */
	const valueFunction = function (vf, unitTime = 1) {
		if (typeof vf === 'function') {
			return vf(unitTime);
		} else {
			return vf * unitTime;
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
	 * 直交座標モーション
	 * @version 2021-02-06
	 */
	class AxisMotion {

		/**
		 * 直交座標モーションを作る
		 * @constructor
		 * @param {number=} [speedX=0] 横方向のスピード
		 * @param {number=} [speedY=0] たて方向のスピード
		 */
		constructor(speedX = 0, speedY = 0) {
			this._speedX = speedX;
			this._speedY = speedY;
			this._checkRangeX = null;
			this._checkRangeY = null;
		}

		/**
		 * 横方向のスピード
		 * @param {number=} val 値
		 * @return {number|AxisMotion} 値／このモーション
		 */
		speedX(val) {
			if (val === undefined) return this._speedX;
			this._speedX = val;
			return this;
		}

		/**
		 * たて方向のスピード
		 * @param {number=} val 値
		 * @return {number|AxisMotion} 値／このモーション
		 */
		speedY(val) {
			if (val === undefined) return this._speedY;
			this._speedY = val;
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
		 * スピードに合わせて座標を更新する
		 * @param {number} unitTime 単位時間
		 * @param {number} x x座標（横の場所）
		 * @param {number} y y座標（たての場所）
		 * @param {number} dir 方向
		 * @return {number[]} 座標
		 */
		update(unitTime, x, y, dir) {
			x += valueFunction(this._speedX, unitTime);
			y += valueFunction(this._speedY, unitTime);
			if (this._checkRangeX !== null) x = this._checkRangeX(x);
			if (this._checkRangeY !== null) y = this._checkRangeY(y);
			return [x, y, dir];
		}

	}


	/**
	 * 極座標モーション
	 * @version 2021-02-06
	 */
	class PolarMotion {

		/**
		 * 極座標モーションを作る
		 * @constructor
		 * @param {number=} [speedA=0] 角度方向のスピード
		 * @param {number=} [speedR=0] 半径方向のスピード
		 * @param {boolean=} [proportionalAngularSpeed=false] 角度方向のスピードが半径に比例する？
		 */
		constructor(speedA = 0, speedR = 0, proportionalAngularSpeed = false) {
			this._speedA = speedA;
			this._speedR = speedR;
			this._propSpeedA = proportionalAngularSpeed;
			this._checkRangeR = null;
		}

		/**
		 * 角度方向のスピード
		 * @param {number=} val 値
		 * @return {number|PolarMotion} 値／このモーション
		 */
		speedA(val) {
			if (val === undefined) return this._speedA;
			this._speedA = val;
			return this;
		}

		/**
		 * 半径方向のスピード
		 * @param {number=} val 値
		 * @return {number|PolarMotion} 値／このモーション
		 */
		speedR(val) {
			if (val === undefined) return this._speedR;
			this._speedR = val;
			return this;
		}

		/**
		 * 半径方向の範囲をセットする
		 * @param {number} min 始まり
		 * @param {number} max 終わり
		 * @param {boolean} isLoop ループする？
		 */
		setRangeR(min, max, isLoop) {
			this._checkRangeR = makeRangeChecker(min, max, isLoop);
		}

		/**
		 * 角度方向のスピードが半径に比例する？
		 * @param {boolean} val 値
		 * @return {boolean|PolarMotion} 値／このモーション
		 */
		proportionalAngularSpeed(val) {
			if (val === undefined) return this._propSpeedA;
			this._propSpeedA = val;
			return this;
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
			let r = Math.sqrt(x * x + y * y);
			r += valueFunction(this._speedR, unitTime);
			if (this._checkRangeR !== null) r = this._checkRangeR(r);

			let p = Math.atan2(y, x) * 180 / Math.PI;
			p += valueFunction(this._speedA, unitTime) / (this._propSpeedA ? r : 1);
			p = checkDegRange(p);

			const d = p * Math.PI / 180;
			return [r * Math.cos(d), r * Math.sin(d), dir];
		}

	}


	/**
	 * 回転
	 * @version 2021-02-06
	 */
	class Rotation {

		/**
		 * 回転を作る
		 * @constructor
		 * @param {number=} [angleSpeed=0] 角度スピード
		 * @param {number=} [angleSpeedX=0] 角度スピードx
		 * @param {number=} [angleSpeedZ=0] 角度スピードz
		 */
		constructor(angleSpeed = 0, angleSpeedX = 0, angleSpeedZ = 0) {
			this._angleSpeed  = angleSpeed;
			this._angleSpeedX = angleSpeedX;
			this._angleSpeedZ = angleSpeedZ;
		}

		/**
		 * 角度スピード
		 * @param {number=} val 角度スピード
		 * @return {number|Element} 角度スピード／この要素
		 */
		angleSpeed(val) {
			if (val === undefined) return this._angleSpeed;
			this._angleSpeed = val;
			return this;
		}

		/**
		 * 角度スピードx
		 * @param {number=} val 角度スピード
		 * @return {number|Element} 角度スピード／この要素
		 */
		angleSpeedX(val) {
			if (val === undefined) return this._angleSpeedX;
			this._angleSpeedX = val;
			return this;
		}

		/**
		 * 角度スピードz
		 * @param {number=} val 角度スピード
		 * @return {number|Element} 角度スピード／この要素
		 */
		angleSpeedZ(val) {
			if (val === undefined) return this._angleSpeedZ;
			this._angleSpeedZ = val;
			return this;
		}

		/**
		 * スピードに合わせて角度を更新する
		 * @param {number} unitTime 単位時間
		 * @param {number} angle z軸を中心とする角度（向き）
		 * @param {number} angleX x軸を中心とする角度（向き）
		 * @param {number} angleZ z軸を中心とする角度2（向き）
		 * @return {number[]} 角度
		 */
		update(unitTime, angle, angleX, angleZ) {
			const a  = checkDegRange(angle  + valueFunction(this._angleSpeed,  unitTime));
			const ax = checkDegRange(angleX + valueFunction(this._angleSpeedX, unitTime));
			const az = checkDegRange(angleZ + valueFunction(this._angleSpeedZ, unitTime));
			return [a, ax, az];
		}

	}


	// ライブラリを作る --------------------------------------------------------


	return { AxisMotion, PolarMotion, Rotation };

}());
