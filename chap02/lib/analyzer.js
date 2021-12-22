/**
 * アナライザー・ライブラリー（ANALYZER）
 *
 * 波形の解析を行うウィジェットを使えるようにするライブラリです。
 *
 * @author Takuto Yanagida
 * @version 2021-02-04
 */


/**
 * ライブラリ変数
 */
const ANALYZER = (function () {

	'use strict';


	// ライブラリ中だけで使用するユーティリティ --------------------------------


	/**
	 * スタイル・ユーティリティ
	 * @author Takuto Yanagida
	 * @version 2021-02-01
	 */


	/**
	 * スタイルを追加する
	 * @param {string} selector セレクター
	 * @param {object} styles スタイル
	 */
	 const addStyle = (function () {
		const s = document.createElement('style');
		s.setAttribute('type', 'text/css');
		document.head.appendChild(s);

		return (selector, styles) => {
			const ps = [];
			for (const [prop, val] of Object.entries(styles)) {
				const p = prop.replace(/([A-Z])/g, m => '-' + m.charAt(0).toLowerCase());
				ps.push(`${p}:${val}`);
			}
			const style = ps.join(';');
			s.sheet.insertRule(`${selector}{${style};}`, s.sheet.cssRules.length);
		};
	})();


	let isBaseStyleAssigned = false;

	/**
	 * ベース・スタイルを登録する
	 */
	const ensureBaseStyle = function () {
		if (isBaseStyleAssigned) return;
		isBaseStyleAssigned = true;
		addStyle('.lavjs-widget-scope', {
			fontSize  : '14px',
			fontFamily: 'Consolas, Menlo, "Courier New", Meiryo, Osaka-Mono, monospace',

			position       : 'relative',
			margin         : '2px',
			padding        : '8px',
			borderRadius   : '1px',
			backgroundColor: 'White',
			boxShadow      : '1px 1px 8px rgba(0, 0, 0, 0.4)',

			display      : 'block',
			verticalAlign: 'middle',
		});
		addStyle('.lavjs-widget-scope-canvas', {
			border: '0',
			fontFamily: 'Consolas, Menlo, "Courier New", Meiryo, Osaka-Mono, monospace',
		});
	};


	/**
	 * スコープ・ベース
	 * @version 2021-05-21
	 */
	class ScopeBase {

		/**
		 * スコープ・ベースを作る
		 * @constructor
		 * @param {number} width 横幅
		 * @param {number} height たて幅
		 */
		constructor(width, height) {
			this._size = 0;
			this._buf = [];
			this._temp = [];
			this._sampleRate = 1;
			this._cors = [];

			this._freeze = false;
			this._isSynchronized = true;
			this._cor = 0;
			this._initView(width, height);
			this._animate();
		}

		/**
		 * 表示を初期化する（ライブラリ内だけで使用）
		 * @private
		 */
		_initView(width, height) {
			ensureBaseStyle();
			this._width  = width  - 16;
			this._height = height - 16;

			this._base = document.createElement('div');
			this._base.className = 'lavjs-widget-scope';
			document.body.appendChild(this._base);

			const can = document.createElement('canvas');
			can.className = 'lavjs-widget-scope-canvas';
			can.setAttribute('width', '' + this._width);
			can.setAttribute('height', '' + this._height);
			can.addEventListener('click', () => { this._freeze = !this._freeze; });
			this._ctx = can.getContext('2d');
			this._base.appendChild(can);

			this._base.style.width    = width + 'px';
			this._base.style.minWidth = width + 'px';
			this._base.style.height   = height + 'px';
		}

		/**
		 * アニメーションする（ライブラリ内だけで使用）
		 * @private
		 */
		_animate() {
			const loop = () => {
				this._update();
				if (this._ctx.canvas.parentNode !== null) {
					window.requestAnimationFrame(loop);
				}
			};
			window.requestAnimationFrame(loop);
		}


		// -------------------------------------------------------------------------


		/**
		 * 自動的にコリレーションを求める（ライブラリ内だけで使用）
		 * @private
		 */
		_autoCorrelate(bufTd, sampleRate, cors) {
			let bestOff = -1;
			let bestCor = 0;
			let found = false;
			let lastCor = 1;

			for (let off = 0; off < cors.length; off += 1) {
				let cor = 0;
				for (let i = 0; i < cors.length; i += 1) {
					cor += Math.abs((bufTd[i]) - (bufTd[i + off])) / 255;
				}
				cor = 1 - (cor / cors.length);
				cors[off] = cor;

				if ((cor > 0.9) && (cor > lastCor)) {
					found = true;
					if (cor > bestCor) {
						bestCor = cor;
						bestOff = off;
					}
				} else if (found) {
					const shift = (cors[bestOff + 1] - cors[bestOff - 1]) / cors[bestOff];
					return [sampleRate / (bestOff + (8 * shift)), bestOff];
				}
				lastCor = cor;
			}
			if (bestCor > 0.01) {
				return [sampleRate / bestOff, bestOff];
			}
			return [-1, 0];
		}

		/**
		 * RMSを計算する（ライブラリ内だけで使用）
		 * @private
		 */
		_calcRms(buf) {
			let s = 0;
			for (const v of buf) s += v * v;
			return Math.sqrt(s / buf.length);
		}

		/**
		 * データをセットする（ライブラリ内だけで使用）
		 * @private
		 */
		_setData(buf, data, offset, isSynchronized, len = buf.length) {
			if (isSynchronized) {
				for (let i = 0; i < len; i += 1) {
					if (len < i + offset) break;
					buf[i] = buf[i] * 0.9 + data[i + offset] * 0.1;
				}
			} else {
				for (let i = 0; i < len; i += 1) {
					buf[i] = data[i];
				}
			}
		}


		// -------------------------------------------------------------------------


		/**
		 * 水平線を描画する（ライブラリ内だけで使用）
		 * @private
		 */
		_drawHLines(ctx, w, h, indicators) {
			ctx.beginPath();
			ctx.moveTo(0, 0); ctx.lineTo(w, 0);
			for (let i = 0; i < 5; i += 1) {
				const y = (i === 0) ? 0.5 : ((h / 4 * i - 1) + 0.5);
				ctx.moveTo(0, y); ctx.lineTo(w, y);
			}
			ctx.stroke();
			ctx.font = 'bold 14px monospace';
			ctx.textAlign = 'left';
			ctx.textBaseline = 'top';
			ctx.fillText(indicators[0], 0, 1);
			ctx.fillText(indicators[1], 0, h / 4);
			ctx.fillText(indicators[2], 0, h / 2);
			ctx.textBaseline = 'bottom';
			ctx.fillText(indicators[3], 0, h * 3 / 4);
			ctx.fillText(indicators[4], 0, h);
		}

		/**
		 * 垂直方向のインジケーターを描画する（ライブラリ内だけで使用）
		 * @private
		 */
		_drawVIndicator(ctx, w, h, x, y, val, unit) {
			ctx.beginPath();
			ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h);
			ctx.stroke();
			ctx.textAlign = 'right';
			ctx.fillText(val, x - 3, y);
			ctx.textAlign = 'left';
			ctx.fillText(unit, x + 3, y);
		}

		/**
		 * コリレーションを描画する（ライブラリ内だけで使用）
		 * @private
		 */
		_drawCorr(ctx, w, h, cor, lowLevel) {
			ctx.textBaseline = 'top';
			ctx.textAlign = 'right';
			const text = lowLevel ? '?' : ((0 | cor + 0.5) + '');
			ctx.fillText(text + ' Hz', w, 1);
		}


		// -------------------------------------------------------------------------


		/**
		 * 同期するかどうかを設定する
		 * @param {boolean} enabled 同期するか
		 */
		setSynchronized(enabled) {
			this._isSynchronized = enabled;
		}

	}


	/**
	 * 波形スコープ
	 * @version 2021-01-29
	 */
	class WaveformScope extends ScopeBase {

		/**
		 * 波形スコープを作る
		 * @constructor
		 * @param {number} width 横幅
		 * @param {number} height たて幅
		 */
		constructor(width, height) {
			super(width, height);
		}

		/**
		 * 更新する（ライブラリ内だけで使用）
		 * @private
		 */
		_update() {
			if (this._freeze) return;
			let cor = -1, pulseW = 0, viewOff = 0, lowLevel = false;

			if (this._source) {
				this._source.getTimeDomainData(this._temp);
				if (Math.abs(128 - this._calcRms(this._temp)) < 0.01) {
					cor = -1;
					lowLevel = true;
				} else {
					[cor, pulseW] = this._autoCorrelate(this._temp, this._sampleRate, this._cors);
					viewOff = this._autoOffset(this._temp, pulseW);
				}
			} else {
				this._temp.fill(128);
			}
			this._setData(this._buf, this._temp, Math.floor(viewOff), this._isSynchronized);
			this._cor = (cor === -1) ? this._cor : (this._cor * 0.9 + cor * 0.1);

			this._drawTime(this._ctx, this._width, this._height, this._buf, this._sampleRate, this._cor, lowLevel);
		}


		// -------------------------------------------------------------------------


		/**
		 * 自動的に波形のオフセットを求める（ライブラリ内だけで使用）
		 * @private
		 */
		_autoOffset(buf, width) {
			let maxSum = 0, o = 0;

			for (let off = 0; off < width * 2; off += 1) {
				const sum = buf[off] + buf[off + width];
				if (maxSum < sum) {
					maxSum = sum;
					o = off;
				}
			}
			let ret = -1;
			for (let shift = 0; shift < width; shift += 1) {
				if (buf[o + shift] < 128) {
					ret = o + shift;
				}
			}
			return ret;
		}


		// -------------------------------------------------------------------------


		/**
		 * 時間軸のグラフを描画する（ライブラリ内だけで使用）
		 * @private
		 */
		_drawTime(ctx, w, h, buf, sampleRate, cor, lowLevel) {
			const len = WaveformScope.WAVE_MSEC_MAX /*ms*/ * sampleRate / 1000;

			ctx.fillStyle = 'White';
			ctx.fillRect(0, 0, w, h);

			// 波形描画
			ctx.strokeStyle = 'rgb(0, 63, 0)';
			ctx.setLineDash([]);
			ctx.beginPath();
			for (let i = 0; i < len; i += 1) {
				const x = w * i / len;
				const y = h * (1 - (buf[i] / 255));
				if (i === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}
			}
			ctx.stroke();

			// 目盛描画
			ctx.fillStyle = 'rgba(0, 127, 127, 0.75)';
			ctx.strokeStyle = 'rgba(0, 127, 127, 1)';
			ctx.setLineDash([2, 2]);
			this._drawHLines(ctx, w, h, ['1.0', '0.5', '', '-0.5', '-1.0']);

			ctx.textBaseline = 'top';
			const I = WaveformScope.WAVE_MSEC_MAX / WaveformScope.WAVE_MSEC_IND;
			for (let i = 1; i < I; i += 1) {
				const x = w * (i * WaveformScope.WAVE_MSEC_IND * sampleRate / 1000) / len;
				this._drawVIndicator(ctx, w, h, x, h / 2, i * WaveformScope.WAVE_MSEC_IND, 'ms');
			}

			// ピッチ描画
			if (cor !== 0 && !lowLevel) {
				ctx.strokeStyle = 'rgba(255, 0, 0, 0.75)';
				ctx.setLineDash([]);
				const x = w * (sampleRate / cor) / len + 0.5;
				ctx.beginPath();
				ctx.moveTo(x, 0); ctx.lineTo(x, h);
				ctx.stroke();
			}
			ctx.fillStyle = 'rgba(0, 127, 127, 0.75)';
			this._drawCorr(ctx, w, h, cor, lowLevel);
		}


		// -------------------------------------------------------------------------


		/**
		 * データ・ソースをセットする
		 * @param {DataSource} dataSource データ・ソース
		 */
		setDataSource(dataSource) {
			if (this._source !== dataSource) this._source = dataSource;
			if (dataSource) {
				this._size = dataSource.size();
				this._buf = new Float32Array(this._size);
				this._buf.fill(128);
				this._temp = new Uint8Array(this._size);
				this._sampleRate = dataSource.sampleRate();
				this._cors = new Array(Math.floor(this._size / 2));
			}
		}

	}

	WaveformScope.WAVE_MSEC_MAX = 20;
	WaveformScope.WAVE_MSEC_IND = 5;


	/**
	 * スペクトル・スコープ
	 * @version 2021-01-29
	 */
	class SpectrumScope extends ScopeBase {

		/**
		 * スペクトル・スコープを作る
		 * @constructor
		 * @param {number} width 横幅
		 * @param {number} height たて幅
		 */
		constructor(width, height) {
			super(width, height);
			this._minDb = 0;
			this._maxDb = 0;
		}

		/**
		 * 更新する（ライブラリ内だけで使用）
		 * @private
		 */
		_update() {
			if (this._freeze) return;
			let cor = 0, lowLevel = false;

			if (this._source) {
				this._source.getTimeDomainData(this._temp);
				if (Math.abs(128 - this._calcRms(this._temp)) < 0.01) {
					cor = -1;
					lowLevel = true;
				} else {
					[cor, ] = this._autoCorrelate(this._temp, this._sampleRate, this._cors);
				}
				this._source.getFrequencyData(this._temp);
			} else {
				this._temp.fill(0);
			}
			this._setData(this._buf, this._temp, 0, this._isSynchronized, this._size / 2);
			this._cor = (cor === -1) ? this._cor : (this._cor * 0.9 + cor * 0.1);

			this._drawFreq(this._ctx, this._width, this._height, this._buf, this._sampleRate, this._cor, lowLevel);
		}


		// -------------------------------------------------------------------------


		/**
		 * 周波数軸のグラフを描画する（ライブラリ内だけで使用）
		 * @private
		 */
		_drawFreq(ctx, w, h, buf, sampleRate, cor, lowLevel) {
			const fs = buf.length;
			const len = SpectrumScope.SPEC_FREQ_MAX * fs / sampleRate;

			ctx.fillStyle = 'White';
			ctx.fillRect(0, 0, w, h);

			// スペクトル描画
			ctx.strokeStyle = 'rgb(0, 0, 63)';
			ctx.setLineDash([]);
			ctx.beginPath();
			for (let i = 0; i < len; i++) {
				const x = w * i / len;
				const y = h * (1 - (buf[i] / 255));
				if (i === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}
			}
			ctx.stroke();

			// 目盛描画
			ctx.fillStyle = 'rgba(0, 127, 255, 0.75)';
			ctx.strokeStyle = 'rgba(0, 127, 255, 1)';
			ctx.setLineDash([2, 2]);
			this._drawHLines(ctx, w, h, ['' + this._maxDb, '', '', '', '' + this._minDb]);

			ctx.textBaseline = 'bottom';
			const I = SpectrumScope.SPEC_FREQ_MAX / SpectrumScope.SPEC_FREQ_IND;
			for (let i = 1; i < I; i += 1) {
				const x = w * (i * SpectrumScope.SPEC_FREQ_IND * fs / sampleRate) / len;
				this._drawVIndicator(ctx, w, h, x, h, i * SpectrumScope.SPEC_FREQ_IND / 1000, 'kHz');
			}

			// ピッチ描画
			if (cor !== 0 && !lowLevel) {
				ctx.strokeStyle = 'rgba(255, 0, 0, 0.75)';
				ctx.setLineDash([]);
				const x = w * (cor * fs / sampleRate) / len + 0.5;
				ctx.beginPath();
				ctx.moveTo(x, 0); ctx.lineTo(x, h);
				ctx.stroke();
			}
			ctx.fillStyle = 'rgba(0, 127, 255, 0.75)';
			this._drawCorr(ctx, w, h, cor, lowLevel);
		}


		// -------------------------------------------------------------------------


		/**
		 * データ・ソースをセットする
		 * @param {DataSource} dataSource データ・ソース
		 */
		setDataSource(dataSource) {
			if (this._source !== dataSource) this._source = dataSource;
			if (dataSource) {
				this._size = dataSource.size();
				this._buf = new Float32Array(this._size);
				this._buf.fill(0);
				this._temp = new Uint8Array(this._size);
				this._sampleRate = dataSource.sampleRate();
				this._cors = new Array(Math.floor(this._size / 2));
				this._minDb = dataSource.minDecibels();
				this._maxDb = dataSource.maxDecibels();
			}
		}

	}

	SpectrumScope.SPEC_FREQ_MAX = 4000;
	SpectrumScope.SPEC_FREQ_IND = 1000;


	// ライブラリを作る --------------------------------------------------------


	return { WaveformScope, SpectrumScope };

})();
