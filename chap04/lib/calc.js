/**
 * 計算ライブラリ（CALC）
 *
 * 範囲を決められるランダム関数や、ある範囲の数を別の範囲の数に変えるマッピング、
 * 単純ではない動きを作るのに使うイージング関数が使えるようになるライブラリです。
 *
 * @author Takuto Yanagida
 * @version 2019-09-03
 */


/**
 * ライブラリ変数
 */
const CALC = (function () {

	'use strict';


	// 乱数関数 ----------------------------------------------------------------


	/**
	 * 基本サイコロ
	 * @author Takuto Yanagida
	 * @version 2020-05-05
	 */
	class DiceBase {

		/**
		 * サイコロを作る
		 * @constructor
		 */
		constructor() {
			this._r = Math.random;
		}

		/**
		 * minからmaxまでのテキトウな数（乱数）を返す
		 * @param {number} min 最小値
		 * @param {number} max 最大値
		 * @param {function(number):number=} opt_fn イージング関数（オプション）
		 * @return {number} テキトウな数（乱数）
		 */
		random(min, max, opt_fn) {
			if (opt_fn === undefined) {
				return this._r() * (max - min) + min;
			}
			return opt_fn(this._r()) * (max - min) + min;
		}

		/**
		 * 0からn_minまで、あるいはminからmaxまでのテキトウな整数（乱数）を返す
		 * @param {number} n_min　整数nか整数min
		 * @param {number=} opt_max　整数max
		 * @return {number} テキトウな整数（乱数）
		 */
		rand(n_min, opt_max) {
			if (opt_max === undefined) {
				return Math.floor(this._r() * (n_min + 1));
			}
			return Math.floor(this._r() * (opt_max + 1 - n_min) + n_min);
		}

		/**
		 * パーセントで指定した確率で起こる
		 * @param {number} percent パーセント
		 * @return {boolean} 起こるかどうか
		 */
		isLikely(percent) {
			return Math.floor(this._r() * (100 + 1)) <= percent;
		}

	}


	/**
	 * サイコロ
	 * @author Takuto Yanagida
	 * @version 2019-05-07
	 */
	class Dice extends DiceBase {

		/**
		 * サイコロを作る
		 */
		constructor(seed = Math.random()) {
			super();
			this._seed = 0 | (seed * (seed < 1 ? 1000 : 1));
			this._r = this._createGenerator(this._seed);
		}

		/**
		 * テキトウな数（乱数）を返す関数を作る（Xorshift32）（ライブラリ内だけで使用）
		 * @private
		 * @param {number} seed シード値
		 * @return {function():number} テキトウな数（乱数）を返す関数
		 */
		_createGenerator(seed) {
			let y = seed;
			const fn = () => {
				y = y ^ (y << 13);
				y = y ^ (y >> 17);
				y = y ^ (y << 15);
				return (y + 2147483648) / 4294967295;
			};
			const stack = [];
			fn.save = () => { stack.push(y); };
			fn.restore = () => { y = stack.pop(); };
			return fn;
		}

		/**
		 * リセットする
		 */
		reset() {
			this._r = this._createGenerator(this._seed);
		}

		/**
		 * 今の状態を保存する
		 */
		save() {
			this._r.save();
		}

		/**
		 * 前の状態を復元する
		 */
		restore() {
			this._r.restore();
		}

	}


	let _dice = new DiceBase();

	/**
	 * ランダム関数にシード値を指定する
	 * 同じシード値では同じランダムの値の組み合わせが作られます。
	 * @param {number} seed シード値
	 */
	const setRandomSeed = function (seed) {
		_dice = new Dice(seed);
	};

	/**
	 * ランダム関数をリセットする
	 */
	const resetRandomSeed = function () {
		if (!(_dice instanceof Dice)) _dice = new Dice();
		_dice.reset();
	};

	/**
	 * ランダム関数の今の状態を保存する
	 */
	const saveRandomState = function () {
		if (!(_dice instanceof Dice)) _dice = new Dice();
		_dice.save();
	};

	/**
	 * ランダム関数の前の状態を復元する
	 */
	const restoreRandomState = function () {
		if (!(_dice instanceof Dice)) _dice = new Dice();
		_dice.restore();
	};

	/**
	 * minからmaxまでのテキトウな数（乱数）を返す
	 * @param {number} min 最小値
	 * @param {number} max 最大値
	 * @param {function(number):number=} opt_fn イージング関数（オプション）
	 * @return {number} テキトウな数（乱数）
	 */
	const random = function (min, max, opt_fn) {
		return _dice.random(min, max, opt_fn);
	};

	/**
	 * 0からn_minまで、あるいはminからmaxまでのテキトウな整数（乱数）を返す
	 * @param {number} n_min　整数nか整数min
	 * @param {number=} opt_max　整数max
	 * @return テキトウな整数（乱数）
	 */
	const rand = function (n_min, opt_max) {
		return _dice.rand(n_min, opt_max);
	};

	/**
	 * パーセントで指定した確率で起こる
	 * @param {number} percent パーセント
	 * @return {boolean} 起こるかどうか
	 */
	const isLikely = function (percent) {
		return _dice.isLikely(percent);
	};


	/**
	 * ノイズ
	 * 参考: Stefan Gustavson, SimplexNoise1234, http://staffwww.itn.liu.se/~stegu/aqsis/aqsis-newnoise/simplexnoise1234.cpp
	 * @author Takuto Yanagida
	 * @version 2020-04-29
	 */
	class Noise {

		/**
		 * ノイズを作る
		 * @constructor
		 */
		constructor() {
			this._perm = [];
			for (let i = 0; i < 256; i += 1) {
				this._perm.push(0 | (Math.random() * 256));
			}
		}

		get(x) {
			return (this._generate(x) + 1) * 0.5;
		}

		_generate(x) {
			const i0 = Math.floor(x);
			const i1 = i0 + 1;
			const x0 = x - i0;
			const x1 = x0 - 1;

			let t0 = 1.0 - x0 * x0;
			t0 *= t0;
			const n0 = t0 * t0 * this._grad(this._perm[i0 & 0xff], x0);

			let t1 = 1.0 - x1 * x1;
			t1 *= t1;
			const n1 = t1 * t1 * this._grad(this._perm[i1 & 0xff], x1);
			return 0.395 * (n0 + n1);
		}

		_grad(hash, x) {
			const h = hash & 15;
			let grad = 1.0 + (h & 7);
			if ((h & 8) !== 0) grad = -grad;
			return (grad * x);
		}

	}


	let _noise = new Noise();

	const noise = function (x) {
		return _noise.get(x);
	};


	// ユーティリティ関数 ------------------------------------------------------


	/**
	 * 数をある範囲の中に制限する
	 * @param {number} val 数
	 * @param {number} min 最小値
	 * @param {number} max 最大値
	 * @param {string=} type タイプ
	 * @return {number} 数
	 */
	const constrain = function (val, min, max, type) {
		if (type === 'loop') {
			if (val < min) return max;
			if (max < val) return min;
		} else {
			if (val < min) return min;
			if (max < val) return max;
		}
		if (val === undefined || Number.isNaN(val)) return min;
		return val;
	};

	/**
	 * ある範囲の数を別の範囲の数に直して返す
	 * @param {number} val 元の数
	 * @param {number} from1 元の範囲の初め
	 * @param {number} to1 元の範囲の終わり
	 * @param {number} from2 別の範囲の初め
	 * @param {number} to2 別の範囲の終わり
	 * @param {function(number):number=} opt_fn イージング関数（オプション）
	 * @return {number} 数
	 */
	const map = function (val, from1, to1, from2, to2, opt_fn) {
		if (from1 < to1) {
			if (val < from1) val = from1;
			if (val > to1)   val = to1;
		} else {
			if (val > from1) val = from1;
			if (val < to1)   val = to1;
		}
		if (opt_fn === undefined) {
			return (val - from1) * (to2 - from2) / (to1 - from1) + from2;
		}
		return opt_fn((val - from1) / (to1 - from1)) * (to2 - from2) + from2;
	};


	/**
	 * イージング関数（アルゴリズム）
	 * 参考: http://easings.net/
	 * @author Takuto Yanagida
	 * @version 2021-02-04
	 */


	/**
	 * リニア（変化なし）
	 * @param {number} t 0～1の数
	 * @return {number} 数
	 */
	const linear = function (t) {
		return t;
	};

	/**
	 * サイン関数（イーズ・イン）
	 * @param {number} t 0～1の数
	 * @return {number} 数
	 */
	const easeInSine = function (t) {
		return -Math.cos(t * (Math.PI / 2)) + 1;
	};

	/**
	 * サイン関数（イーズ・アウト）
	 * @param {number} t 0～1の数
	 * @return {number} 数
	 */
	const easeOutSine = function (t) {
		return Math.sin(t * (Math.PI / 2));
	};

	/**
	 * サイン関数（イーズ・インとイーズ・アウト）
	 * @param {number} t 0～1の数
	 * @return {number} 数
	 */
	const easeInOutSine = function (t) {
		return -0.5 * (Math.cos(Math.PI * t) - 1);
	};

	/**
	 * 二次関数（イーズ・イン）
	 * @param {number} t 0～1の数
	 * @return {number} 数
	 */
	const easeInQuad = function (t) {
		return t * t;
	};

	/**
	 * 二次関数（イーズ・アウト）
	 * @param {number} t 0～1の数
	 * @return {number} 数
	 */
	const easeOutQuad = function (t) {
		return -t * (t - 2);
	};

	/**
	 * 二次関数（イーズ・インとイーズ・アウト）
	 * @param {number} t 0～1の数
	 * @return {number} 数
	 */
	const easeInOutQuad = function (t) {
		t *= 2;
		if (t < 1) {
			return 0.5 * t * t;
		}
		t -= 1;
		return -0.5 * (t * (t - 2) - 1);
	};

	/**
	 * 三次関数（イーズ・イン）
	 * @param {number} t 0～1の数
	 * @return {number} 数
	 */
	const easeInCubic = function (t) {
		return t * t * t;
	};

	/**
	 * 三次関数（イーズ・アウト）
	 * @param {number} t 0～1の数
	 * @return {number} 数
	 */
	const easeOutCubic = function (t) {
		t -= 1;
		return (t * t * t + 1);
	};

	/**
	 * 三次関数（イーズ・インとイーズ・アウト）
	 * @param {number} t 0～1の数
	 * @return {number} 数
	 */
	const easeInOutCubic = function (t) {
		t *= 2;
		if (t < 1) {
			return 0.5 * t * t * t;
		}
		t -= 2;
		return 0.5 * (t * t * t + 2);
	};

	/**
	 * 四次関数（イーズ・イン）
	 * @param {number} t 0～1の数
	 * @return {number} 数
	 */
	const easeInQuart = function (t) {
		return t * t * t * t;
	};

	/**
	 * 四次関数（イーズ・アウト）
	 * @param {number} t 0～1の数
	 * @return {number} 数
	 */
	const easeOutQuart = function (t) {
		t -= 1;
		return -(t * t * t * t - 1);
	};

	/**
	 * 四次関数（イーズ・インとイーズ・アウト）
	 * @param {number} t 0～1の数
	 * @return {number} 数
	 */
	const easeInOutQuart = function (t) {
		t *= 2;
		if (t < 1) {
			return 0.5 * t * t * t * t;
		}
		t -= 2;
		return -0.5 * (t * t * t * t - 2);
	};

	/**
	 * 五次関数（イーズ・イン）
	 * @param {number} t 0～1の数
	 * @return {number} 数
	 */
	const easeInQuint = function (t) {
		return t * t * t * t * t;
	};

	/**
	 * 五次関数（イーズ・アウト）
	 * @param {number} t 0～1の数
	 * @return {number} 数
	 */
	const easeOutQuint = function (t) {
		t -= 1;
		return (t * t * t * t * t + 1);
	};

	/**
	 * 五次関数（イーズ・インとイーズ・アウト）
	 * @param {number} t 0～1の数
	 * @return {number} 数
	 */
	const easeInOutQuint = function (t) {
		t *= 2;
		if (t < 1) {
			return 0.5 * t * t * t * t * t;
		}
		t -= 2;
		return 0.5 * (t * t * t * t * t + 2);
	};

	/**
	 * 指数関数（イーズ・イン）
	 * @param {number} t 0～1の数
	 * @return {number} 数
	 */
	const easeInExpo = function (t) {
		return Math.pow(2, 10 * (t - 1));
	};

	/**
	 * 指数関数（イーズ・アウト）
	 * @param {number} t 0～1の数
	 * @return {number} 数
	 */
	const easeOutExpo = function (t) {
		return -Math.pow(2, -10 * t) + 1;
	};

	/**
	 * 指数関数（イーズ・インとイーズ・アウト）
	 * @param {number} t 0～1の数
	 * @return {number} 数
	 */
	const easeInOutExpo = function (t) {
		t *= 2;
		if (t < 1) {
			return 0.5 * Math.pow(2, 10 * (t - 1));
		}
		t -= 1;
		return 0.5 * (-Math.pow(2, -10 * t) + 2);
	};

	/**
	 * 円関数（イーズ・イン）
	 * @param {number} t 0～1の数
	 * @return {number} 数
	 */
	const easeInCirc = function (t) {
		return -(Math.sqrt(1 - t * t) - 1);
	};

	/**
	 * 円関数（イーズ・アウト）
	 * @param {number} t 0～1の数
	 * @return {number} 数
	 */
	const easeOutCirc = function (t) {
		t -= 1;
		return Math.sqrt(1 - t * t);
	};

	/**
	 * 円関数（イーズ・インとイーズ・アウト）
	 * @param {number} t 0～1の数
	 * @return {number} 数
	 */
	const easeInOutCirc = function (t) {
		t *= 2;
		if (t < 1) {
			return -0.5 * (Math.sqrt(1 - t * t) - 1);
		}
		t -= 2;
		return 0.5 * (Math.sqrt(1 - t * t) + 1);
	};


	// ライブラリを作る --------------------------------------------------------


	return {
		Dice,
		setRandomSeed,
		resetRandomSeed,
		saveRandomState,
		restoreRandomState,

		random, rand, isLikely,
		constrain, map,

		Noise,
		noise,

		linear,
		easeInSine, easeOutSine, easeInOutSine,
		easeInQuad, easeOutQuad, easeInOutQuad,
		easeInCubic, easeOutCubic, easeInOutCubic,
		easeInQuart, easeOutQuart, easeInOutQuart,
		easeInQuint, easeOutQuint, easeInOutQuint,
		easeInExpo, easeOutExpo, easeInOutExpo,
		easeInCirc, easeOutCirc, easeInOutCirc,
	};

}());
