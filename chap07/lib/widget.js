/**
 * ウィジェット・ライブラリ（WIDGET）
 *
 * 様々なウィジェット（コントロール）を使えるようにするライブラリです。
 *
 * @author Takuto Yanagida
 * @version 2021-05-11
 */


/**
 * ライブラリ変数
 */
const WIDGET = (function () {

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
		addStyle('.lavjs-widget', {
			margin    : '0',
			padding   : '0',
			fontSize  : '14px',
			fontFamily: 'Consolas, Menlo, "Courier New", Meiryo, Osaka-Mono, monospace',
		});
		addStyle('.lavjs-widget-base', {
			display        : 'inline-flex',
			position       : 'relative',
			margin         : '2px',
			padding        : '8px',
			borderRadius   : '1px',
			backgroundColor: 'White',
			boxShadow      : '1px 1px 8px rgba(0, 0, 0, 0.4)',
		});
		addStyle('.lavjs-widget-full', {
			width   : '100%',
			height  : '100%',
			position: 'relative',
		});
		addStyle('.lavjs-widget-button-row', {
			gap: '8px',
		});
		addStyle('.lavjs-widget-button', {
			flex          : '1 1 1',
			minWidth      : '28px',
			minHeight     : '28px',
			display       : 'grid',
			placeItems    : 'center',
			padding       : '4px 8px',
			overflow      : 'hidden',
			borderRadius  : '3px',
			boxShadow     : '0 1px 6px 1px rgba(0, 0, 0, 0.35)',
			cursor        : 'pointer',
			userSelect    : 'none',
		});
		addStyle('.lavjs-widget-button:hover:not(.active)', {
			boxShadow: '0 0 2px 1px rgba(0, 0, 0, 0.25)',
		});
		addStyle('.lavjs-widget-button.active', {
			boxShadow: '1px 1px 8px rgba(0, 0, 0, 0.4) inset',
		});
		addStyle('.lavjs-widget-chat pre', {
			minHeight   : '1.25em',
			margin      : '0',
			font        : 'inherit',
			whiteSpace  : 'normal',
			overflowWrap: 'break-word',
		});
		addStyle('.lavjs-widget-chat-message', {
			width    : '100%',
			overflowY: 'auto',
			flexGrow : '1',
			height   : '1.25em',
			minHeight: '1.25em',
		});
		addStyle('.lavjs-widget-chat-hr', {
			marginTop   : '0.5rem',
			marginBottom: '0',
			width       : '100%',
			height      : '2px',
			borderTop   : '1px solid #bbb',
		});
		addStyle('.lavjs-widget-chat-prompt:not(:empty)', {
			marginTop   : '0.5rem',
			overflowY   : 'auto',
		});
		addStyle('.lavjs-widget-chat-prompt a', {
			textDecoration : 'underline',
			cursor         : 'pointer',
			color          : '#12f',
			backgroundColor: '#12f1',
		});
		addStyle('.lavjs-widget-chat-input', {
			width       : '100%',
			overflowY   : 'scroll',
			height      : '2em',
			minHeight   : '2em',
			marginTop   : '0.5rem',
			borderRadius: '6px',
			border      : '1px solid #bbb',
			boxShadow   : '0 1px 2px rgba(0, 0, 0, 0.25) inset',
		});
		addStyle('.lavjs-widget-slider-knob', {
			position       : 'absolute',
			width          : '16px',
			height         : '16px',
			margin         : '-8px 0px 0px -8px',
			backgroundColor: 'White',
			borderRadius   : '4px',
			boxShadow      : '0 1px 6px 2px rgba(0, 0, 0, 0.35)',  // There is a slight different from buttons
			cursor         : '-webkit-grab',
		});
		addStyle('.lavjs-widget-slider-output', {
			display     : 'block',
			marginBottom: '10px',
			width       : '100%',
			height      : '20px',
			textAlign   : 'right',
			border      : 'none',
			boxShadow   : '0 0 2px rgba(0, 0, 0, 0.25) inset',
		});
	};


	/**
	 * ウィジェット共通
	 * @author Takuto Yanagida
	 * @version 2021-05-21
	 */
	class Widget {

		/**
		 * ウィジェットを作る
		 * @constructor
		 * @param {number=} [width=null] 横幅
		 * @param {number=} [height=null] たて幅
		 * @param {string=} [cls=null] CSSクラス
		 */
		constructor(width = null, height = null, cls = null) {
			ensureBaseStyle();
			this._base = document.createElement('div');
			this._base.className = 'lavjs-widget lavjs-widget-base' + (cls ? ` ${cls}` : '');
			if (width !== null) {
				this._base.style.width = width + 'px';
				this._base.style.minWidth = width + 'px';
			}
			if (height !== null) {
				this._base.style.height = height + 'px';
			}
			document.body.appendChild(this._base);
		}

		/**
		 * DOM要素を返す
		 * @return {HTMLDivElement} DOM要素
		 */
		domElement() {
			return this._base;
		}

		/**
		 * 横幅をフルにするかどうかをセットする
		 * @param {boolean} flag 横幅をフルにするかどうか
		 */
		setFullWidth(flag) {
			this._base.style.flexBasis = flag ? '100%' : 'auto';
		}

		/**
		 * 表示するかどうかをセットする
		 * @param {boolean} flag 表示するかどうか
		 */
		setVisible(flag) {
			this._base.style.display = flag ? '' : 'none';
		}

	}


	/**
	 * チャット
	 * @author Takuto Yanagida
	 * @version 2021-05-21
	 */
	class Chat extends Widget {

		/**
		 * チャットUIを作る
		 * @constructor
		 * @param {number} width 横幅
		 * @param {number=} [height=null] たて幅
		 * @param {object} [opts={}] オプション
		 * @param {string=} [opts.startTag='['] 開始タグ
		 * @param {string=} [opts.endTag=']'] 終了タグ
		 */
		constructor(width, height = null, opts = {}) {
			const { startTag = '[', endTag = ']' } = opts;
			super(width, height, 'lavjs-widget-chat');
			this._base.style.flexDirection = 'column';

			this._startTag = startTag;
			this._endTag   = endTag;
			this._lastLine = null;

			this._message = document.createElement('div');
			this._message.className = 'lavjs-widget-chat-message';

			this._hr = document.createElement('hr');
			this._hr.className = 'lavjs-widget-chat-hr';

			this._prompt = document.createElement('pre');
			this._prompt.className = 'lavjs-widget-chat-prompt';

			this._input = document.createElement('input');
			this._input.className = 'lavjs-widget-chat-input';
			this._input.disabled = true;

			this._base.appendChild(this._message);
			this._base.appendChild(this._hr);
			this._base.appendChild(this._prompt);
			this._base.appendChild(this._input);

			this._setInputEnabled(false);
		}

		/**
		 * 入力を有効にする（ライブラリ内だけで使用）
		 * @private
		 * @param {boolean} flag 有効かどうか
		 */
		_setInputEnabled(flag) {
			if (flag) {
				this._input.value = '';
				this._input.style.display = 'block';
				this._input.disabled = false;
				this._input.focus();
			} else {
				this._input.blur();
				this._input.disabled = true;
				this._input.style.display = 'none';
				this._input.value = '';
				this._prompt.innerText = '';
				this._hr.style.display = 'none';
			}
		}

		/**
		 * 表示する
		 * @param {...*} args 表示する内容
		 * @return {Chat} このウィジェット
		 */
		print(...args) {
			const str = Chat.escHtml(args.map(e => e.toString()).join(' '));
			this._addMessage(str);
			return this;
		}

		/**
		 * 1行表示する
		 * @param {...*} args 表示する内容
		 * @return {Chat} このウィジェット
		 */
		println(...args) {
			const str = Chat.escHtml(args.map(e => e.toString()).join(' '));
			this._addMessage(str + '\n');
			return this;
		}

		/**
		 * メッセージを追加する（ライブラリ内だけで使用）
		 * @private
		 * @param {string} str 文字列
		 */
		_addMessage(str) {
			const lf = str.length && str[str.length - 1] === '\n';
			const ss = (lf ? str.substr(0, str.length - 1) : str).split('\n');

			let m = this._lastLine ?? document.createElement('pre');
			for (let i = 0; i < ss.length; i += 1) {
				if (i !== 0) m = document.createElement('pre');
				m.innerHTML += ss[i];
				this._message.appendChild(m);
				this._message.scrollTop = this._message.scrollHeight;
			}
			this._lastLine = lf ? null : m;
		}

		/**
		 * 入力させる
		 * @param {...*} prompt プロンプト
		 * @return {Promise<string>} 入力された文字列
		 */
		input(...prompt) {
			const str = prompt.map(e => e.toString()).join(' ');
			this._setInputEnabled(true);
			this._setPrompt(str);
			this._hr.style.display = prompt.length ? 'block' : 'none';
			this._message.scrollTop = this._message.scrollHeight;
			return new Promise(res => {
				const handler = (e) => {
					if (e.code !== 'Enter') return;
					res(this._input.value);
					this._setInputEnabled(false);
					this._input.removeEventListener('keydown', handler);
				}
				this._input.addEventListener('keydown', handler);
			});
		}


		/**
		 * プロンプトをセットする（ライブラリ内だけで使用）
		 * @private
		 * @param {string} str 文字列
		 */
		_setPrompt(str) {
			if (str === '') {
				this._prompt.innerHTML = '';
				return;
			}
			const escRe = str => str.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');

			const sTag = escRe(Chat.escHtml(this._startTag));
			const eTag = escRe(Chat.escHtml(this._endTag));
			const re = new RegExp(`(${sTag})(.*?)(${eTag})`, 'gm');
			str = Chat.escHtml(str);
			str = str.replace(re, (m, a1, a2, a3) => `${a1}<a data-str="${a2}">${a2}</a>${a3}`);
			this._prompt.innerHTML = str;
			const as = this._prompt.getElementsByTagName('a');
			for (const a of as) {
				a.addEventListener('click', e => {
					this._input.value = e.target.dataset.str;
					this._input.focus();
				});
			}
		}

		/**
		 * 動作を停止する
		 * @param {number} seconds 秒数
		 * @return {Promise}
		 */
		sleep(seconds) {
			return new Promise(res => setTimeout(res, seconds * 1000));
		}

	}

	Chat.escHtml = str => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace('\t', '&#009;').replace(' ', '&ensp;');


	/**
	 * スイッチ（ラジオ・ボタン）
	 * @author Takuto Yanagida
	 * @version 2021-05-21
	 */
	class Switch extends Widget {

		/**
		 * スイッチを作る
		 * @constructor
		 * @param {string|string[]|number=} [label_s_num=''] ボタンの名前／ボタンの数
		 * @param {number=} [value=0] 今押されているボタンの番号
		 * @param {object} [opts={}] オプション
		 * @param {boolean=} [opts.vertical=false] たて向きにする？
		 * @param {boolean=} [opts.sameWidth=false] 同じ幅にする？
		 */
		constructor(label_s_num = 2, value = 0, opts = {}) {
			const { vertical = false, sameWidth = false } = opts;
			super();
			this._base.classList.add('lavjs-widget-button-row');
			this._base.style.flexDirection = vertical ? 'column' : 'row';

			let labs = null;
			if (Number.isInteger(label_s_num)) {
				labs = [...Array(label_s_num).keys()];
			} else {
				labs = Array.isArray(label_s_num) ? label_s_num : [label_s_num];
			}
			this._value   = (0 <= value && value < labs.length) ? value : (labs.length - 1);
			this._buttons = [];

			const maxLabLen = Math.max(...labs.map(s => s.length));

			for (const lab of labs) {
				const b = document.createElement('a');
				b.className = 'lavjs-widget lavjs-widget-button';
				b.innerText = '' + lab;
				if (sameWidth) b.style.width = `${maxLabLen}em`;
				b.addEventListener('click', this._handleClickEvent.bind(this));
				this._buttons.push(b);
				this._base.appendChild(b);
			}
			this._buttons[this._value].classList.add('active');
		}

		/**
		 * クリック・イベントに対応する（ライブラリ内だけで使用）
		 * @private
		 * @param {MouseEvent} e マウス・イベント
		 */
		_handleClickEvent(e) {
			if (e.button !== 0) return;
			this._value = this._buttons.indexOf(e.target);
			if (this._onClick) this._onClick(this._value);
			this._updateState();
		}

		/**
		 * ボタンの状態を更新する（ライブラリ内だけで使用）
		 * @private
		 */
		_updateState() {
			for (const b of this._buttons) b.classList.remove('active');
			this._buttons[this._value].classList.add('active');
		}

		/**
		 * 現在の値
		 * @param {number} val 現在の値
		 * @return {number|Switch} 現在の値／このスイッチ
		 */
		value(val) {
			if (val === undefined) return this._value;
			const changing = this._value !== val;
			this._value = val;
			if (changing && this._onClick) this._onClick(this._value);
			this._updateState();
			return this;
		}

		/**
		 * クリック・イベントに対応する関数
		 * @param {function(number):void} handler 関数
		 * @param {boolean=} doFirst 最初に一度実行するか
		 * @return {function(number):void|Switch} 関数／このスイッチ
		 */
		onClick(handler, doFirst = false) {
			if (handler === undefined) return this._onClick;
			this._onClick = handler;
			if (doFirst) {
				setTimeout(() => {
					this._onClick(this._value);
					this._updateState();
				}, 0);
			}
			return this;
		}

	}


	/**
	 * トグル（チェックボックス）
	 * @author Takuto Yanagida
	 * @version 2021-05-21
	 */
	class Toggle extends Widget {

		/**
		 * トグル・ボタンを作る
		 * @constructor
		 * @param {string|string[]|number=} [label_s_num=''] ボタンの名前／ボタンの数
		 * @param {boolean|boolean[]=} [value_s=false] 現在の状態
		 * @param {object} [opts={}] オプション
		 * @param {boolean=} [opts.vertical=false] たて向きにする？
		 * @param {boolean=} [opts.sameWidth=false] 同じ幅にする？
		 */
		constructor(label_s_num = 1, value_s = false, opts = {}) {
			const { vertical = false, sameWidth = false } = opts;
			super();
			this._base.classList.add('lavjs-widget-button-row');
			this._base.style.flexDirection = vertical ? 'column' : 'row';

			let labs = null;
			if (Number.isInteger(label_s_num)) {
				labs = [...Array(label_s_num).keys()];
			} else {
				labs = Array.isArray(label_s_num) ? label_s_num : [label_s_num];
			}
			this._values  = Array.isArray(value_s) ? value_s : [value_s];
			this._buttons = [];

			const num = (value_s ? Math.max(this._values.length, labs.length) : labs.length);
			this._values.length = labs.length = num;
			const maxLabLen = Math.max(...labs.map(s => s.length));

			for (const lab of labs) {
				const b = document.createElement('a');
				b.className = 'lavjs-widget lavjs-widget-button';
				b.innerText = '' + lab;
				if (sameWidth) b.style.width = `${maxLabLen}em`;
				b.addEventListener('click', this._handleClickEvent.bind(this));
				this._buttons.push(b);
				this._base.appendChild(b);
			}
		}

		/**
		 * クリック・イベントに対応する（ライブラリ内だけで使用）
		 * @private
		 * @param {MouseEvent} e マウス・イベント
		 */
		_handleClickEvent(e) {
			if (e.button !== 0) return;
			const i = this._buttons.indexOf(e.target);
			this._values[i] = !this._values[i]
			if (this._onClick) this._onClick(this._values[i], i);
			this._updateState();
		}

		/**
		 * ボタンの状態を更新する（ライブラリ内だけで使用）
		 * @private
		 */
		_updateState() {
			this._values.forEach((s, i) => {
				this._buttons[i].classList[s ? 'add' : 'remove']('active');
			});
		}

		/**
		 * 現在の値
		 * @param {boolean[]} vals 現在の値
		 * @return {boolean|boolean[]|Toggle} 現在の値／このトグル
		 */
		value(...vals) {
			if (vals.length === 0) {
				return this._values.length === 1 ? this._values[0] : this._values.concat();
			}
			if (vals.length === 1 && Array.isArray(vals[0])) vals = vals[0];
			for (let i = 0, I = Math.min(vals.length, this._values.length); i < I; i += 1) {
				const changing = this._values[i] !== vals[i];
				this._values[i] = vals[i];
				if (changing && this._onClick) this._onClick(this._values[i], i);
			}
			this._updateState();
			return this;
		}

		/**
		 * クリック・イベントに対応する関数
		 * @param {function(boolean, number):void} handler 関数
		 * @param {boolean=} doFirst 最初に一度実行するか
		 * @return {function(boolean, number):void|Toggle} 関数／このトグル
		 */
		onClick(handler, doFirst = false) {
			if (handler === undefined) return this._onClick;
			this._onClick = handler;
			if (doFirst) {
				setTimeout(() => {
					this._values.forEach((s, i) => this._onClick(s, i));
					this._updateState();
				}, 0);
			}
			return this;
		}

	}


	/**
	 * 行出力
	 * @author Takuto Yanagida
	 * @version 2021-05-21
	 */
	class Output extends Widget {

		/**
		 * 行出力を作る
		 * @constructor
		 * @param {number} width 横幅
		 * @param {number=} [height=null] たて幅
		 * @param {object} [opts={}] オプション
		 * @param {boolean=} [opts.nowrap=false] 折り返す？
		 */
		constructor(width, height = null, opts = {}) {
			const { nowrap = false } = opts;
			super(width, height);
			this._inner = document.createElement('div');
			if (nowrap) {
				this._inner.style.lineHeight = '1';
			} else {
				this._inner.style.whiteSpace = 'normal';
			}
			this._inner.style.overflow = 'hidden';
			this._base.appendChild(this._inner);
		}

		/**
		 * 現在の値
		 * @param {*=} vals 現在の値
		 * @return {string|Output} 現在の値／この出力
		 */
		value(...vals) {
			if (vals.length === 0) return this._inner.innerText;
			const str = vals.map(e => e.toString()).join(' ');
			this._inner.innerText = str;
			return this;
		}

	}


	/**
	 * グラフ
	 * @author Takuto Yanagida
	 * @version 2021-07-30
	 */
	class Chart extends Widget {

		/**
		 * グラフを作る
		 * @constructor
		 * @param {number} [width=300] 横幅
		 * @param {number} [height=150] たて幅
		 */
		constructor(width = 300, height = 150) {
			super(width, height);

			this._can = document.createElement('canvas');
			this._can.className = 'lavjs-widget lavjs-widget-full lavjs-widget-chart-inner';
			this._can.addEventListener('click', this._handleClickEvent.bind(this));
			this._base.appendChild(this._can);
			// 以下はbaseに追加した後に行うこと（offsetWidth/Heightは追加後でないと取得できない）
			this._can.setAttribute('width', '' + this._can.offsetWidth);
			this._can.setAttribute('height', '' + this._can.offsetHeight);

			this._allDataMode  = true;
			this._items        = {};
			this._keys         = [];
			this._selectedKeys = [];
			this._data         = {};
			this._mins         = {};
			this._maxes        = {};

			this._legendWidth = 128;
			this._digits      = 1;
		}

		/**
		 * クリック・イベントに対応する（ライブラリ内だけで使用）
		 * @private
		 * @param {MouseEvent} e マウス・イベント
		 */
		_handleClickEvent(e) {
			if (e.button !== 0) return;
			if (this._legendWidth < e.offsetX) {
				this._allDataMode = !this._allDataMode;
			} else {
				if (16 < e.offsetY % 20) return;
				const idx = 0 | (e.offsetY / 20);
				if (idx < 0 || this._keys.length - 1 < idx) return;
				const cur = this._keys[idx];
				const sks = Object.fromEntries(this._selectedKeys.map(e => [e, true]));
				sks[cur] = sks[cur] ? false : true;
				this._selectedKeys.length = 0;
				for (const k of this._keys) {
					if (sks[k]) this._selectedKeys.push(k);
				}
			}
			this._draw(this._legendWidth);
		}

		/**
		 * 凡例の幅をセットする
		 * @param {number} px 幅
		 */
		setLegendWidth(px) {
			this._legendWidth = px;
		}

		/**
		 * 桁数をセットする
		 * @param {number} num 桁数
		 */
		setDigits(num) {
			this._digits = num;
		}

		/**
		 * 項目の設定をセットする
		 * @param {dict} items 項目の設定
		 */
		setItems(items) {
			// items = {key1: {name: 'name1', style: 'style1'}, key2: {}, ...}
			this._items = {};
			this._keys  = [];
			this._data  = {};
			this._mins  = {};
			this._maxes = {};

			let ci = 0;
			for (const key in items) {
				const i = items[key];
				const name  = (i !== undefined && i.name  !== undefined) ? i.name  : key;
				const style = (i !== undefined && i.style !== undefined) ? i.style : Chart.ITEM_COLORS[ci];
				this._keys.push(key);
				this._selectedKeys.push(key);
				this._items[key] = { name, style };
				this._data[key]  = [];
				this._mins[key]  = 0;
				this._maxes[key] = 0;

				ci += 1;
				if (Chart.ITEM_COLORS.length <= ci) ci = 0;
			}
			const count = Object.keys(items).length;
			const ch = parseInt(this._can.getAttribute('height'), 10);
			if (ch < count * 20 - 4) {
				const h = count * 20 - 4;
				this._base.style.height = `${h + 16}px`;
				this._can.style.height = `${h}px`;
				this._can.setAttribute('height', '' + h);
			}
		}

		/**
		 * データを追加する
		 * @param {object} data データ
		 */
		addData(data) {
			for (const key of this._keys) {
				const v = data[key];
				this._data[key].push(v);
				if (v < this._mins[key])  this._mins[key]  = v;
				if (this._maxes[key] < v) this._maxes[key] = v;
			}
			this._draw(this._legendWidth);
		}

		/**
		 * 絵をかく
		 * @private
		 * @param {number} legendWidth 凡例の幅
		 */
		_draw(legendWidth) {
			const c = this._can.getContext('2d');
			c.clearRect(0, 0, this._can.width, this._can.height);

			this._drawLegend(c, legendWidth);
			const cx = this._can.width - legendWidth, cy = this._can.height;

			const keys = this._selectedKeys.length ? this._selectedKeys : this._keys;
			const min = Math.min(...keys.map(k => this._mins[k]));
			const max = Math.max(...keys.map(k => this._maxes[k]));

			this._drawFrame(c, legendWidth, cx, cy, min, max);
			if (this._allDataMode) {
				this._drawAllDataMode(c, legendWidth, cx, cy, min, max, keys);
			} else {
				this._drawScrollMode(c, legendWidth, cx, cy, min, max, keys);
			}
		}

		/**
		 * 凡例をかく
		 * @private
		 * @param {Paper|CanvasRenderingContext2D} ctx 紙／キャンバス・コンテキスト
		 * @param {number} legendWidth 凡例の幅
		 */
		_drawLegend(ctx, legendWidth) {
			ctx.font = '12px sans-serif';
			ctx.globalAlpha = 1;
			let y = 0;
			for (const key of this._keys) {
				if (this._selectedKeys.length) {
					ctx.globalAlpha = this._selectedKeys.includes(key) ? 1 : 0.5;
				}
				const { name, style } = this._items[key];
				ctx.fillStyle = style;
				ctx.save();
				ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
				ctx.shadowOffsetY = 1;
				ctx.shadowBlur = 6;
				ctx.fillRect(0, y, 16, 16);
				ctx.restore();

				ctx.fillStyle = 'Black';
				ctx.textAlign = 'left';
				ctx.fillText(name, 16 + 8, y + 13);

				const ds = this._data[key];
				const v = ds[ds.length - 1];
				ctx.textAlign = 'right';
				ctx.fillText(this._format(this._digits, v), legendWidth - 8, y + 13);

				y += 20;
			}
			ctx.globalAlpha = 1;
		}

		/**
		 * フォーマットする
		 * @private
		 * @param {number} digits 桁数
		 * @param {number} val 値
		 * @return {string} フォーマットされた文字列
		 */
		_format(digits, val) {
			if (digits === 0) {
				return (0 | val) + '';
			}
			const dv = Number.parseInt('1' + '0'.repeat(digits));
			const nv = (0 | val * dv) / dv;
			const sv = nv + '';
			const idx = sv.indexOf('.');
			if (idx === -1) {
				return sv + '.' + '0'.repeat(digits);
			} else {
				return sv + '0'.repeat(digits - (sv.length - idx - 1));
			}
		}

		/**
		 * わくをかく
		 * @private
		 * @param {Paper|CanvasRenderingContext2D} ctx 紙／キャンバス・コンテキスト
		 * @param {number} left 横の場所
		 * @param {number} cx 横の幅
		 * @param {number} cy たての幅
		 * @param {number} min 最小値
		 * @param {number} max 最大値
		 */
		_drawFrame(ctx, left, cx, cy, min, max) {
			ctx.strokeStyle = 'Black';
			ctx.beginPath();
			ctx.moveTo(left, 0);
			ctx.lineTo(left, cy);
			ctx.lineTo(left + cx, cy);
			ctx.stroke();
			if (min !== 0 || max !== 0) {
				const y = (max - 0) / (max - min) * cy;
				ctx.beginPath();
				ctx.moveTo(left, y);
				ctx.lineTo(left + cx, y);
				ctx.stroke();
			}
		}

		/**
		 * 全データ表示モードの絵をかく
		 * @private
		 * @param {Paper|CanvasRenderingContext2D} ctx 紙／キャンバス・コンテキスト
		 * @param {number} left 横の場所
		 * @param {number} cx 横の幅
		 * @param {number} cy たての幅
		 * @param {number} min 最小値
		 * @param {number} max 最大値
		 * @param {string[]} keys データ・キーの配列
		 */
		_drawAllDataMode(ctx, left, cx, cy, min, max, keys) {
			for (const key of keys) {
				const ds = this._data[key];
				const len = ds.length;
				if (len === 0) continue;

				ctx.strokeStyle = this._items[key].style;
				ctx.beginPath();
				ctx.moveTo(left, cy - ds[0] * cy / max);

				let prevX = 0, prevY = 0;
				for (let i = 1, I = ds.length; i < I; i += 1) {
					const x = left + cx / len * i;
					const dx = x - prevX;
					if (0.5 < dx) {
						const y = (max - ds[i]) / (max - min) * cy;
						if (1.0 < dx || cy * 0.5 < Math.abs(y - prevY)) {
							ctx.lineTo(x, y);
							prevX = x;
							prevY = y;
						}
					}
				}
				ctx.stroke();
			}
		}

		/**
		 * スクロール・モードの絵をかく
		 * @private
		 * @param {Paper|CanvasRenderingContext2D} ctx 紙／キャンバス・コンテキスト
		 * @param {number} left 横の場所
		 * @param {number} cx 横の幅
		 * @param {number} cy たての幅
		 * @param {number} min 最小値
		 * @param {number} max 最大値
		 * @param {string[]} keys データ・キーの配列
		 */
		_drawScrollMode(ctx, left, cx, cy, min, max, keys) {
			for (const key of keys) {
				const ds = this._data[key];
				let len = ds.length;
				if (len === 0) continue;
				const st = Math.max(0, len - cx);
				len -= st;

				ctx.strokeStyle = this._items[key].style;
				ctx.beginPath();
				ctx.moveTo(left, cy - ds[st] * cy / max);

				for (let i = st + 1, I = ds.length; i < I; i += 1) {
					const x = left + (i - st);
					const y = (max - ds[i]) / (max - min) * cy;
					ctx.lineTo(x, y);
				}
				ctx.stroke();
			}
		}

	}

	Chart.ITEM_COLORS = [
		'rgb( 91, 155, 213)',
		'rgb(237, 125,  49)',
		'rgb(165, 165, 165)',
		'rgb(255, 192,   0)',
		'rgb( 68, 114, 196)',
		'rgb(112, 173,  71)',
		'rgb( 37,  94, 145)',
		'rgb(158,  72,  14)',
		'rgb( 99,  99,  99)',
		'rgb(153, 115,   0)',
		'rgb( 38,  68, 120)',
		'rgb( 67, 104,  43)',
	];


	/**
	 * スライダー・ベース
	 * @author Takuto Yanagida
	 * @version 2021-05-21
	 */
	class SliderBase extends Widget {

		/**
		 * スライダー・ベースを作る
		 * @constructor
		 * @param {number=} [width=null] 横幅
		 * @param {number=} [height=null] たて幅
		 * @param {object} [opts={}] オプション
		 * @param {boolean=} [opts.int=false] 整数にする？
		 * @param {boolean=} [opts.reverse=false] 向きを逆にする？
		 * @param {boolean=} [opts.vertical=true] たて向きにする？
		 */
		constructor(width = null, height = null, opts = {}) {
			const { int = false, reverse = false, vertical = true } = opts;
			super(width, height);
			this._int      = int;
			this._reverse  = reverse;
			this._vertical = vertical;

			this._value = 0;
			this._min   = 0;
			this._max   = 0;

			this._margin      = 14;
			this._railSize    = 0;
			this._railPosRate = this._vertical ? 0.5 : 0.45;

			this._output = document.createElement('input');
			this._output.className = 'lavjs-widget-slider-output';
			this._output.type = 'text';
			this._output.readOnly = true;
			this._base.appendChild(this._output);

			this._inner = document.createElement('div');
			this._inner.className = 'lavjs-widget-full';
			this._base.appendChild(this._inner);
		}

		/**
		 * 最小値
		 * @param {number=} val 最小値
		 * @return {number|SliderBase} 最小値／このスライダー・ベース
		 */
		min(val) {
			if (val === undefined) return this._min;
			this._min = val;
			this._draw();
			this.value(this._value);
			return this;
		}

		/**
		 * 最大値
		 * @param {number=} val
		 * @return {number|SliderBase} 最大値／このスライダー・ベース
		 */
		max(val) {
			if (val === undefined) return this._max;
			this._max = val;
			this._draw();
			this.value(this._value);
			return this;
		}

		/**
		 * 現在の値
		 * @param {number=} val 現在の値
		 * @return {number|SliderBase} 現在の値／このスライダー・ベース
		 */
		value(val) {
			if (val === undefined) return this._value;
			val = (val < this._min) ? this._min : ((this._max < val) ? this._max : val);
			this._value = (this._int) ? Math.round(val) : val;
			if (this._onChange) this._onChange(this._value);
			this._valueChanged();
			return this;
		}

		/**
		 * 現在値欄でのキー・ダウン（キーが押された）イベントに対応する（ライブラリ内だけで使用）
		 * @protected
		 * @param {KeyboardEvent} e キーボード・イベント
		 */
		_handleKeyDownEvent(e) {
			e.preventDefault();
			const v = this.value();
			if (e.code === 'ArrowDown' || e.code === 'ArrowLeft') {
				const vi = Math.floor(v);
				if (vi === v) this.value(v - 1);
				else this.value(vi);
			} else if (e.code === 'ArrowUp' || e.code === 'ArrowRight') {
				const vi = Math.ceil(v);
				if (vi === v) this.value(v + 1);
				else this.value(vi);
			}
		}

		/**
		 * チェンジ・イベントに対応する関数
		 * @param {function(number):void=} handler 関数
		 * @return {function(number):void|SliderBase} 関数／このスライダー・ベース
		 */
		onChange(handler) {
			if (handler === undefined) return this._onChange;
			this._onChange = handler;
			return this;
		}

		/**
		 * 現在の値からつまみの場所を計算する（ライブラリ内だけで使用）
		 * @protected
		 * @param {number} v 現在の値
		 * @return {number} 場所
		 */
		_valueToPos(v) {
			v = (this._int) ? Math.round(v) : v;
			const p = (v - this._min) * this._railSize / (this._max - this._min);
			if (this._reverse) return this._railSize - p;
			return p;
		}

		/**
		 * つまみの場所から現在の値を計算する（ライブラリ内だけで使用）
		 * @protected
		 * @param {number} p つまみの場所
		 * @return {number} 現在の値
		 */
		_posToValue(p) {
			if (this._reverse) p = this._railSize - p;
			const v = this._min + p * (this._max - this._min) / this._railSize;
			return (this._int) ? Math.round(v) : v;
		}


		// -------------------------------------------------------------------------


		/**
		 * みぞの絵をかく（ライブラリ内だけで使用）
		 * @protected
		 * @param {HTMLCanvasElement} canvas キャンバス
		 * @param {number} width 幅
		 */
		_drawRail(canvas, width) {
			const isv = this._vertical, m = this._margin;
			const c = canvas.getContext('2d');
			const x = (isv ? canvas.width : canvas.height) * this._railPosRate - width * 0.5;

			const ga = isv ? [x, 0, x + width, 0] : [0, x, 0, x + width];
			const grad = c.createLinearGradient(...ga);

			const cs = '#dadada, #eee, #eee, #fff, #fafafa, #e0e0e0'.split(', ');
			for (let i = 0; i < 6; i += 1) {
				grad.addColorStop(i / 5, cs[i]);
			}
			c.save();
			c.fillStyle = grad;
			const fra = isv ? [x, m + 1, width, canvas.height - m * 2 - 2] : [m + 1, x, canvas.width - m * 2 - 2, width];
			c.fillRect(...fra);
			c.restore();
		}

		/**
		 * 目もりの絵をかく（ライブラリ内だけで使用）
		 * @protected
		 * @param {HTMLCanvasElement} canvas キャンバス
		 * @param {number} subWidth サブ目もりの幅
		 */
		_drawScale(canvas, subWidth) {
			const isv = this._vertical;
			const maxInterval = this._calcMaxRange(this._min, this._max, 25);
			const interval = this._calcInterval(maxInterval, 25);
			const minInterval = this._calcInterval(interval, 5);
			const width = (isv ? canvas.width : canvas.height), subX = (width * this._railPosRate - subWidth * 0.5);
			const c = canvas.getContext('2d');
			c.clearRect(0, 0, canvas.width, canvas.height);
			c.textAlign = isv ? 'right' : 'center';
			c.font = '10.5px sans-serif';

			for (let m = this._min; m <= this._max; m += 1) {
				const y = this._valueToPos(m) + this._margin;
				if (m % interval === 0) {
					c.beginPath();
					if (isv) {
						c.moveTo(0, y);
						c.lineTo(width, y);
					} else {
						c.moveTo(y, 0);
						c.lineTo(y, width);
					}
					c.lineWidth = 0.8;
					c.stroke();
					const dta = isv ? [width, y - 3, 3] : [y, width - 1, 5];
					drawText(c, m - (m % interval) + '', ...dta);
				} else if (m % minInterval === 0) {
					c.beginPath();
					if (isv) {
						c.moveTo(subX, y);
						c.lineTo(subX + subWidth, y);
					} else {
						c.moveTo(y, subX);
						c.lineTo(y, subX + subWidth);
					}
					c.lineWidth = 0.8;
					c.stroke();
				}
			}
			function drawText(c, str, x, y, lineWidth) {
				c.lineWidth = lineWidth;
				c.strokeStyle = '#fff';
				c.strokeText(str, x, y);
				c.strokeStyle = '#000';
				c.fillText(str, x, y);
			}
		}

		/**
		 * 最大範囲を計算する（ライブラリ内だけで使用）
		 * @private
		 * @param {number} min 最小値
		 * @param {number} max 最大値
		 * @param {number} minInt 最小の間隔
		 * @return {number} 最大範囲
		 */
		_calcMaxRange(min, max, minInt) {
			const is = [5000, 2500, 2000, 1000, 500, 250, 200, 100, 50, 25, 20, 10, 5, 2, 1];
			const len = Math.max(Math.abs(min), Math.abs(max));
			let minM = len, ret = 0;
			for (const i of is) {
				const m = len % i;
				if (m < minM && minInt < this._calcOneInt(i)) {
					ret = i;
					minM = m;
				}
			}
			return (0 | (len / ret)) * ret;
		}

		/**
		 * 間隔を計算する（ライブラリ内だけで使用）
		 * @private
		 * @param {number} baseInt 基準の間隔
		 * @param {number} minInt 最小の間隔
		 * @return {number} 間隔
		 */
		_calcInterval(baseInt, minInt) {
			const is = [5000, 2500, 2000, 1000, 500, 250, 200, 100, 50, 25, 20, 10, 5, 2, 1];
			let ret = baseInt;
			for (const i of is) {
				if (baseInt % i !== 0) continue;
				if (minInt < this._calcOneInt(i)) ret = i;
			}
			if (ret !== baseInt) return ret;
			let minM = baseInt;
			for (const i of is) {
				const m = baseInt % i;
				if (m < minM && minInt < this._calcOneInt(i)) {
					ret = i;
					minM = m;
				}
			}
			return ret;
		}

		/**
		 * 間隔を一つ計算する（ライブラリ内だけで使用）
		 * @private
		 * @param {number} val 値
		 * @return {number} 間隔
		 */
		_calcOneInt(val) {
			const y1 = this._valueToPos(val), y2 = this._valueToPos(val * 2);
			return Math.abs(y2 - y1);
		}

	}


	/**
	 * スライダー
	 * @author Takuto Yanagida
	 * @version 2021-05-21
	 */
	class Slider extends SliderBase {

		/**
		 * スライダーを作る
		 * @constructor
		 * @param {number} [min=0] 最小値
		 * @param {number} [max=10] 最大値
		 * @param {number} [value=0] 現在の値
		 * @param {object} [opts={}] オプション
		 * @param {boolean=} [opts.int=false] 整数にする？
		 * @param {boolean=} [opts.reverse=false] 向きを逆にする？
		 * @param {boolean=} [opts.vertical=true] たて向きにする？
		 * @param {number=} [opts.width=null] 横幅
		 * @param {number=} [opts.height=null] たて幅
		 */
		constructor(min = 0, max = 10, value = 0, opts = {}) {
			const { int = false, reverse = false, vertical = true } = opts;
			let { width = null, height = null } = opts;
			if (width  === null) width  = vertical ? 72 : 400;
			if (height === null) height = vertical ? 400 : 72;
			super(width, height, { int, reverse, vertical });

			this._min = min;
			this._max = max;

			if (vertical) {
				this._base.style.flexDirection = 'column';
				this._inner.style.height = 'calc(100% - 30px)';
			} else {
				this._output.style.width = '56px';
				this._inner.style.width = 'calc(100% - 56px)';
			}

			this._scale = document.createElement('canvas');
			this._scale.className = 'lavjs-widget lavjs-widget-full';
			this._inner.appendChild(this._scale);
			// 以下はbaseに追加した後に行うこと（offsetWidth/Heightは追加後でないと取得できない）
			this._scale.setAttribute('width', '' + this._scale.offsetWidth);
			this._scale.setAttribute('height', '' + this._scale.offsetHeight);

			this._railSize = (this._vertical ? this._scale.height : this._scale.width) - this._margin * 2;
			this._dragging = false;

			this._inner.addEventListener('mousedown', this._handleMouseDownEvent.bind(this));
			this._inner.addEventListener('mousemove', this._handleMouseMoveEvent.bind(this));
			document.addEventListener('mousemove', this._handleMouseMoveEvent.bind(this));
			document.addEventListener('mouseup', this._handleMouseUpEvent.bind(this));
			this._output.addEventListener('keydown', this._handleKeyDownEvent.bind(this));

			this._knob = document.createElement('div');
			this._knob.className = 'lavjs-widget lavjs-widget-slider-knob';
			if (this._vertical) {
				this._knob.style.left = (this._inner.offsetWidth * this._railPosRate) + 'px';
				this._knob.style.top = this._margin + 'px';
			} else {
				this._knob.style.top = (this._inner.offsetHeight * this._railPosRate) + 'px';
				this._knob.style.left = this._margin + 'px';
			}
			this._inner.appendChild(this._knob);

			this._draw();
			this.value(value);
		}

		/**
		 * 値が変更されたときに呼び出される（ライブラリ内だけで使用）
		 * @private
		 */
		_valueChanged() {
			this._output.value = '' + (Math.round(this._value * 100) / 100);
			if (this._vertical) {
				this._knob.style.top = this._margin + this._valueToPos(this._value) + 'px';
			} else {
				this._knob.style.left = this._margin + this._valueToPos(this._value) + 'px';
			}
		}

		/**
		 * つまみの場所を求める（ライブラリ内だけで使用）
		 * @private
		 * @param {MouseEvent} e マウス・イベント
		 * @return {number} 場所
		 */
		_getKnobPos(e) {
			const r = this._scale.getBoundingClientRect();
			// クライアント座標系から計算する必要あり！
			let p;
			if (this._vertical) {
				p = e.clientY - this._margin - r.top;
			} else {
				p = e.clientX - this._margin - r.left;
			}
			return Math.min(Math.max(0, p), this._railSize);
		}

		/**
		 * マウス・ダウン（ボタンが押された）イベントに対応する（ライブラリ内だけで使用）
		 * @private
		 * @param {MouseEvent} e マウス・イベント
		 */
		_handleMouseDownEvent(e) {
			if (e.button !== 0) return;
			this.value(this._posToValue(this._getKnobPos(e)));
			this._dragging = true;
			this._knob.style.cursor = '-webkit-grabbing';
			this._scale.style.cursor = '-webkit-grabbing';
			e.preventDefault();
		}

		/**
		 * マウス・ムーブ（ポインターが移動した）イベントに対応する（ライブラリ内だけで使用）
		 * @private
		 * @param {MouseEvent} e マウス・イベント
		 */
		_handleMouseMoveEvent(e) {
			if (e.button !== 0) return;
			if (!this._dragging) return;
			this.value(this._posToValue(this._getKnobPos(e)));
			e.preventDefault();
		}

		/**
		 * マウス・アップ（ボタンが離された）イベントに対応する（ライブラリ内だけで使用）
		 * @private
		 * @param {MouseEvent} e マウス・イベント
		 */
		_handleMouseUpEvent(e) {
			if (e.button !== 0) return;
			this._dragging = false;
			this._knob.style.cursor = '-webkit-grab';
			this._scale.style.cursor = 'auto';
		}

		/**
		 * 絵をかく（ライブラリ内だけで使用）
		 * @private
		 */
		_draw() {
			this._drawScale(this._scale, 12);
			this._drawRail(this._scale, 6);
		}

	}


	/**
	 * 温度計
	 * @author Takuto Yanagida
	 * @version 2021-05-21
	 */
	class Thermometer extends SliderBase {

		/**
		 * 温度計を作る
		 * @constructor
		 * @param {number=} [min=-10] 最小温度
		 * @param {number=} [max=50] 最大温度
		 * @param {number=} [value=25] 現在の温度
		 * @param {object} [opts={}] オプション
		 * @param {number=} [opts.width=72] 横幅
		 * @param {number=} [opts.height=400] たて幅
		 */
		constructor(min = -10, max = 50, value = 25, opts = {}) {
			const { width = 72, height = 400 } = opts;
			super(width, height, { int: true, reverse: true });

			this._min = 0 | min;
			this._max = 0 | max;

			this._base.style.flexDirection = 'column';
			this._inner.style.height = 'calc(100% - 30px)';

			this._scale = document.createElement('canvas');
			this._scale.className = 'lavjs-widget lavjs-widget-full';
			this._inner.appendChild(this._scale);
			// 以下はbaseに追加した後に行うこと（offsetWidth/Heightは追加後でないと取得できない）
			this._scale.setAttribute('width', '' + this._scale.offsetWidth);
			this._scale.setAttribute('height', '' + this._scale.offsetHeight);

			this._railSize = this._scale.height - this._margin * 2;
			this._dragging = false;

			this._inner.addEventListener('mousedown', this._handleMouseDownEvent.bind(this));
			this._inner.addEventListener('mousemove', this._handleMouseMoveEvent.bind(this));
			document.addEventListener('mousemove', this._handleMouseMoveEvent.bind(this));
			document.addEventListener('mouseup', this._handleMouseUpEvent.bind(this));
			this._output.addEventListener('keydown', this._handleKeyDownEvent.bind(this));

			this._draw();
			this.value(value);
		}

		/**
		 * 値が変更されたときに呼び出される（ライブラリ内だけで使用）
		 * @private
		 */
		_valueChanged() {
			this._output.value = this._value + '℃';
			this._draw();
		}

		/**
		 * つまみの場所を求める（ライブラリ内だけで使用）
		 * @private
		 * @param {MouseEvent} e マウス・イベント
		 * @return {number} 場所
		 */
		_getKnobPos(e) {
			const r = this._scale.getBoundingClientRect();
			// クライアント座標系から計算する必要あり！
			const p = e.clientY - this._margin - r.top;
			return Math.min(Math.max(0, p), this._railSize);
		}

		/**
		 * マウス・ダウン（ボタンが押された）イベントに対応する（ライブラリ内だけで使用）
		 * @private
		 * @param {MouseEvent} e マウス・イベント
		 */
		_handleMouseDownEvent(e) {
			if (e.button !== 0) return;
			this.value(this._posToValue(this._getKnobPos(e)));
			this._dragging = true;
			this._scale.style.cursor = '-webkit-grabbing';
			e.preventDefault();
		}

		/**
		 * マウス・ムーブ（ポインターが移動した）イベントに対応する（ライブラリ内だけで使用）
		 * @private
		 * @param {MouseEvent} e マウス・イベント
		 */
		_handleMouseMoveEvent(e) {
			if (e.button !== 0) return;
			if (!this._dragging) return;
			this.value(this._posToValue(this._getKnobPos(e)));
			e.preventDefault();
		}

		/**
		 * マウス・アップ（ボタンが離された）イベントに対応する（ライブラリ内だけで使用）
		 * @private
		 * @param {MouseEvent} e マウス・イベント
		 */
		_handleMouseUpEvent(e) {
			if (e.button !== 0) return;
			this._dragging = false;
			this._scale.style.cursor = 'auto';
		}


		/**
		 * 絵をかく（ライブラリ内だけで使用）
		 * @private
		 */
		_draw() {
			this._drawScale(this._scale, 16);
			this._drawRail(this._scale, 10);
			this._drawFiller(this._scale, 10);
		}

		/**
		 * 中身をかく（ライブラリ内だけで使用）
		 * @private
		 * @param {HTMLCanvasElement} canvas キャンバス
		 * @param {number} width 幅
		 */
		_drawFiller(canvas, width) {
			const c = canvas.getContext('2d');
			const x = (canvas.width - width) / 2;
			const grad = c.createLinearGradient(x, 0, x + width, 0);
			const cs = '#f00, #f55, #faa, #e55, #e00, #da0000'.split(', ');
			for (let i = 0; i < 6; i += 1) {
				grad.addColorStop(i / 5, cs[i]);
			}
			const st = Math.max(1, this._valueToPos(this._value));
			c.save();
			c.fillStyle = grad;
			c.fillRect(x, this._margin + st, width, canvas.height - this._margin * 2 - 1 - st);
			c.restore();
		}

	}


	// ライブラリを作る --------------------------------------------------------


	return { Widget, Chat, Switch, Toggle, Output, Chart, Slider, Thermometer };

}());
