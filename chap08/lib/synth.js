/**
 * シンセサイザー・ライブラリー（SYNTH）
 *
 * @author Takuto Yanagida
 * @version 2021-02-04
 */


/**
 * ライブラリ変数
 */
const SYNTH = (function () {

	'use strict';


	// ライブラリ中だけで使用するユーティリティ --------------------------------


	// キー文字列正規化リスト
	const KEY_NORM_LIST = {
		sr        : 'swingRatio',
		inst      : 'instrument',
		tempo     : 'bpm',
		amp       : 'gain',

		makeOsc   : 'makeOscillator',
		makeMic   : 'makeMicrophone',
		makeFile  : 'makeBufferSource',
		makeFilter: 'makeBiquadFilter',
		makeEnv   : 'makeEnvelope',
	};

	/**
	 * 関数（メソッド）の別名をつける
	 * @param {object} target 対象クラス
	 */
	function assignAlias(target) {
		for (const [a, orig] of Object.entries(KEY_NORM_LIST)) {
			if (target.prototype[orig]) {
				target.prototype[a] = target.prototype[orig];
			}
		}
	}

	/**
	 * パラメーターのキーを正規化する
	 * @param {object} params パラメーター
	 * @return {object} 正規化されたパラメーター
	 */
	function normalizeParams(params) {
		const ret = {};
		for (const [key, val] of Object.entries(params)) {
			const k = KEY_NORM_LIST[key] ?? key;
			const v = KEY_NORM_LIST[val] ?? val;
			ret[k] = v;
		}
		return ret;
	}


	/**
	 * シンセ
	 * @version 2021-02-05
	 */
	class Synth {

		/**
		 * シンセを作る
		 * @constructor
		 */
		constructor() {
			this._context = new AudioContext();
			this._patches = [];
			this._sources = [];
		}

		/**
		 * オーディオ・コンテキストを返す
		 * @return {AudioContext} オーディオ・コンテキスト
		 */
		context() {
			return this._context;
		}

		/**
		 * 現在の時刻を返す
		 * @return {number} 時刻
		 */
		time() {
			return this._context.currentTime;
		}

		/**
		 * スピーカーを返す
		 * @param {object} params パラメーター
		 * @return {SpeakerPatch} スピーカー・パッチ
		 */
		speaker(params = {}) {
			if (!this._speaker) {
				this._speaker = new PATCH.SpeakerPatch(this, params);
				this._patches.push(this._speaker);
			}
			return this._speaker;
		}


		// -------------------------------------------------------------------------


		/**
		 * オシレーター・パッチを作る
		 * @param {object} params パラメーター
		 * @return {OscillatorPatch} パッチ
		 */
		makeOscillator(params = {}) {
			params = PATCH.normalizeParams(params);
			const p = new PATCH.OscillatorPatch(this, params);
			return this._addPatch(p);
		}

		/**
		 * ノイズ・パッチを作る
		 * @param {object} params パラメーター
		 * @return {NoisePatch} パッチ
		 */
		makeNoise(params = {}) {
			params = PATCH.normalizeParams(params);
			const p = new PATCH.NoisePatch(this, params);
			return this._addPatch(p);
		}

		/**
		 * マイクロフォン・パッチを作る
		 * @param {object} params パラメーター
		 * @return {MicrophonePatch} パッチ
		 */
		makeMicrophone(params = {}) {
			params = PATCH.normalizeParams(params);
			const p = new PATCH.MicrophonePatch(this, params);
			return this._addPatch(p);
		}

		/**
		 * バッファー・ソース・パッチを作る
		 * @param {object} params パラメーター
		 * @return {BufferSourcePatch} パッチ
		 */
		makeBufferSource(params = {}) {
			params = PATCH.normalizeParams(params);
			const p = new PATCH.BufferSourcePatch(this, params);
			return this._addPatch(p);
		}

		/**
		 * ゲイン・パッチを作る
		 * @param {object} params パラメーター
		 * @return {GainPatch} パッチ
		 */
		makeGain(params = {}) {
			params = PATCH.normalizeParams(params);
			const p = new PATCH.GainPatch(this, params);
			return this._addPatch(p);
		}

		/**
		 * 二次フィルター・パッチを作る
		 * @param {object} params パラメーター
		 * @return {BiquadFilterPatch} パッチ
		 */
		makeBiquadFilter(params = {}) {
			params = PATCH.normalizeParams(params);
			const p = new PATCH.BiquadFilterPatch(this, params);
			return this._addPatch(p);
		}

		/**
		 * エンベロープ・パッチを作る
		 * @param {object} params パラメーター
		 * @return {EnvelopePatch} パッチ
		 */
		makeEnvelope(params = {}) {
			params = PATCH.normalizeParams(params);
			const p = new PATCH.EnvelopePatch(this, params);
			return this._addPatch(p);
		}

		/**
		 * スコープ・パッチを作る
		 * @param {object} params パラメーター
		 * @return {ScopePatch} パッチ
		 */
		makeScope(params = {}) {
			params = PATCH.normalizeParams(params);
			const p = new PATCH.ScopePatch(this, params);
			return this._addPatch(p);
		}

		/**
		 * パッチを追加する（ライブラリ内だけで使用）
		 * @private
		 * @param {Patch} p パッチ
		 * @return {Patch} パッチ
		 */
		_addPatch(p) {
			this._patches.push(p);
			if (p instanceof PATCH.SourcePatch) {
				this._sources.push(p);
			}
			return p;
		}


		// -------------------------------------------------------------------------


		/**
		 * パッチを繋げる
		 * @param {Patch[]} ps パッチ
		 * @return {Synth} このシンセ
		 */
		connect(...ps) {
			let lp = null;
			for (let p of ps) {
				p = Array.isArray(p) ? p : [p];
				if (lp) {
					for (const j of lp) {
						for (const i of p) j.getOutput().connect(i.getInput());
					}
				}
				lp = p;
			}
			return this;
		}

		/**
		 * 再生する
		 * @param {number=} time 時刻 [s]
		 * @return {Synth} このシンセ
		 */
		play(time = this._context.currentTime) {
			for (const p of this._sources) {
				p.play(time);
			}
			return this;
		}

		/**
		 * 停止する
		 * @param {number=} time 時刻 [s]
		 * @return {Synth} このシンセ
		 */
		stop(time = this._context.currentTime) {
			for (const p of this._sources) {
				p.stop(time);
			}
			return this;
		}

	}

	assignAlias(Synth);


	/**
	 * スケジューラー
	 * @version 2021-05-21
	 */
	class Scheduler {

		/**
		 * スケジューラーを作る
		 * @constructor
		 * @param {function():number} timestampFunction 現在時刻を返す関数
		 */
		constructor(timestampFunction) {
			this._timestamp = timestampFunction;
			this._intId = null;
			this._events = [];
		}

		/**
		 * スケジュールされたタスクを行う（ライブラリ内だけで使用）
		 * @private
		 */
		_process() {
			const bgn = this._timestamp();
			const end = bgn + Scheduler.SCHEDULE_SPAN / 1000;

			const es = this._events;
			while (es.length && es[0].time < end) {
				const e = es.shift();
				e.callback({ sender: this, time: e.time }, ...e.args);
			}
		}

		/**
		 * 現在の時刻を返す
		 * @return {number} 時刻
		 */
		time() {
			return this._timestamp();
		}

		/**
		 * タスクを挿入する
		 * @param {number} time 時刻
		 * @param {function} callback タスク
		 * @param {...*} args タスクに渡す引数
		 * @return {Scheduler} このスケジューラー
		 */
		insert(time, callback, ...args) {
			const e = { time, callback, args };

			const es = this._events;
			if (es.length === 0 || es[es.length - 1].time <= time) {
				es.push(e);
				return this;
			}
			for (let i = 0; i < es.length; i += 1) {
				if (time < es[i].time) {
					es.splice(i, 0, e);
					break;
				}
			}
			return this;
		}

		/**
		 * スケジューリングの次のタイミングで処理を行うようにタスクを追加する
		 * @param {number} time 時刻
		 * @param {function} callback タスク
		 * @param {...*} args タスクに渡す引数
		 * @return {Scheduler} このスケジューラー
		 */
		nextTick(time, callback, ...args) {
			const t = time ?? this._timestamp();
			this.insert(t + Scheduler.SCHEDULE_SPAN / 1000, callback, ...args);
			return this;
		}

		/**
		 * スケジューリングを始める
		 * @param {function} callback タスク
		 * @param {...*} args タスクに渡す引数
		 * @return {Scheduler} このスケジューラー
		 */
		start(callback = null, ...args) {
			if (this._intId === null) {
				this._intId = setInterval(this._process.bind(this), Scheduler.TICK_INTERVAL);
				if (callback) {
					this.insert(this._timestamp(), callback, args);
					this._process();
				}
			} else if (callback) {
				this.insert(this._timestamp(), callback, args);
			}
			return this;
		}

		/**
		 * スケジューリングを止める
		 * @param {boolean=} reset リセットするか
		 * @return {Scheduler} このスケジューラー
		 */
		stop(reset = false) {
			if (this._intId !== null) {
				clearInterval(this._intId);
				this._intId = null;
			}
			if (reset) {
				this._events.splice(0);
			}
			return this;
		}

	}

	Scheduler.TICK_INTERVAL = 25;
	Scheduler.SCHEDULE_SPAN = 100;


	/**
	 * シーケンサー
	 * @version 2021-02-05
	 */
	class Sequencer {

		/**
		 * シーケンサーを作る
		 * @constructor
		 * @param {Synth|AudioContext} ctx シンセ／オーディオ・コンテキスト
		 * @param {object} params パラメーター
		 */
		constructor(ctx, params) {
			const nowFn = (ctx instanceof Synth) ? (() => ctx.time()) : (() => ctx.currentTime);
			this._scheduler = new Scheduler(nowFn);
			this._lastTime = 0;
			this._buf = [];

			params = normalizeParams(params);
			this._inst       = params.instrument ?? null;
			this._play       = params.play       ?? null;
			this._tune       = params.tune       ?? null;
			this._stop       = params.stop       ?? null;
			this._bpm        = params.bpm        ?? 100;
			this._gain       = params.gain       ?? 1;
			this._swingRatio = params.swingRatio ?? 0.5;

			this._octave   = 4;
			this._length   = 4;
			this._volume   = 5;
			this._gateTime = 10;
			this._opts     = [];
		}

		/**
		 * 再生する
		 * @param {number=} delay 遅延時間 [s]
		 */
		play(delay = 0.5) {
			const now = this._scheduler.time() + delay;
			for (const b of this._buf) {
				const [t, fn] = b;
				this._scheduler.insert(now + t, fn);
			}
			this._scheduler.start();
		}

		/**
		 * リセットする
		 */
		reset() {
			this._scheduler.stop(true);
			this._lastTime = 0;
			this._buf = [];
		}


		// -------------------------------------------------------------------------


		/**
		 * 楽譜をセットする
		 * @param {string} notes 楽譜を表す文字列
		 * @return {Sequencer} このシーケンサー
		 */
		setScore(notes) {
			let ps = 0;
			let dur = 0;
			for (let i = 0; i < notes.length; i += 1) {
				const ch = notes[i];
				switch (ch) {
					case 'C': case 'D': case 'E': case 'F': case 'G': case 'A': case 'B':
						[ps,  i] = this._getPitchShift(notes, i + 1);
						[dur, i] = this._getLength(notes, i + 1);
						this._sound(dur, ch, ps);
						this._lastTime += dur;
						break;
					case 'R':
						[dur, i] = this._getLength(notes, i + 1);
						this._lastTime += dur;
						break;
					case 'Q':
						[this._gateTime, i] = this._getNumber(notes, i + 1, this._gateTime);
						break;
					case 'L':
						[this._length, i] = this._getNumber(notes, i + 1, this._length);
						break;
					case 'O':
						[this._octave, i] = this._getNumber(notes, i + 1, this._octave);
						break;
					case 'V':
						[this._volume, i] = this._getNumber(notes, i + 1, this._volume);
						break;
					case 'T':
						[this._bpm, i] = this._getNumber(notes, i + 1, this._bpm);
						break;
					case '>':
						this._octave += 1;
						break;
					case '<':
						this._octave -= 1;
						break;
					case '{':
						[this._opts, i] = this._getOption(notes, i + 1);
						break;
					case ' ': case '|':
						break;
					default:
						throw new Error(`${notes.slice(0, i)} ${notes[i]} ${notes.slice(i + 1)}`);
				}
			}
			return this;
		}

		/**
		 * フラットとシャープを取得する（ライブラリ内だけで使用）
		 * @private
		 * @param {string} str 楽譜を表す文字列
		 * @param {number} idx 調べるインデックス
		 * @return {number[]} 音程のズレと調べ終わったインデックス
		 */
		_getPitchShift(str, idx) {
			Sequencer.RE_PITCH_SHIFT.lastIndex = idx;
			const res = Sequencer.RE_PITCH_SHIFT.exec(str);
			if (res === null) return [0, idx - 1];
			let v = 0;
			for (const c of res[0]) {
				if (c === '+' || c === '#') v += 1;
				else if (c === '-') v -= 1;
			}
			return [v, Sequencer.RE_PITCH_SHIFT.lastIndex - 1];
		}

		/**
		 * 数値を取得する（ライブラリ内だけで使用）
		 * @private
		 * @param {string} str 楽譜を表す文字列
		 * @param {number} idx 調べるインデックス
		 * @return {number[]} 数値と調べ終わったインデックス
		 */
		_getNumber(str, idx, def) {
			Sequencer.RE_NUMBER.lastIndex = idx;
			const res = Sequencer.RE_NUMBER.exec(str);
			if (res === null) return [def, idx - 1];
			const v = parseInt(res[0]);
			return [v, Sequencer.RE_NUMBER.lastIndex - 1];
		}

		/**
		 * 音符と休符の長さを取得する（ライブラリ内だけで使用）
		 * @private
		 * @param {string} str 楽譜を表す文字列
		 * @param {number} idx 調べるインデックス
		 * @return {number[]} 長さと調べ終わったインデックス
		 */
		_getLength(str, idx) {
			const def = (4 * (60 / this._bpm) * (1 / this._length));
			Sequencer.RE_LENGTH.lastIndex = idx;
			const res = Sequencer.RE_LENGTH.exec(str);
			if (res === null) return [def, idx - 1];
			let dur = null;
			let dots = null;
			if (!res[1]) {
				dur = def;
				dots = res[0];
			} else {
				const v = parseInt(res[1]);
				dur = (4 * (60 / this._bpm) * (1 / v));
				if (res[2]) dots = res[2];
			}
			if (dots) {
				let hl = dur / 2;
				for (let i = 0; i < dots.length; i += 1) {
					dur += hl;
					hl /= 2;
				}
			}
			return [dur, Sequencer.RE_LENGTH.lastIndex - 1];
		}

		/**
		 * オプションを取得する（ライブラリ内だけで使用）
		 * @private
		 * @param {string} str 楽譜を表す文字列
		 * @param {number} idx 調べるインデックス
		 * @return {Array} オプションと調べ終わったインデックス
		 */
		_getOption(str, idx) {
			let o = null;
			let i = idx;
			for (; i < str.length; i += 1) {
				const ch = str[i];
				if (ch === '}') {
					o = str.substr(idx, i - idx);
					break;
				}
			}
			if (o === null) throw new Error(`${str.slice(0, idx - 1)} ${str[idx - 1]} ${str.slice(idx)}`);
			const opts = [];
			if (o) {
				const os = o.split(',');
				for (const o of os) {
					const v = parseFloat(o);
					if (Number.isNaN(v)) opts.push(o);
					else opts.push(v);
				}
			}
			return [opts, i];
		}

		/**
		 * 音を鳴らす（ライブラリ内だけで使用）
		 * @private
		 * @param {number} dur 音の継続時間 [s]
		 * @param {string} noteCh 音程を表す文字
		 * @param {number} shift 音程のズレ
		 */
		_sound(dur, noteCh, shift) {
			const base = Sequencer.NOTE_TO_BASE_NO[noteCh];
			const nn = base + (this._octave + 1) * 12 + shift;
			const freq = 440 * Math.pow(2, (nn - 69) / 12);

			const gain = this._gain * this._volume / 9;
			dur *= (this._gateTime / 10);
			const opts = this._opts;
			const fn = (e) => {
				if (this._tune) this._tune(this._inst, e.time, gain, freq, ...opts);
				if (this._play) this._play(this._inst, e.time);
				if (this._stop) this._stop(this._inst, e.time + dur);
			};
			this._buf.push([this._lastTime, fn]);
		}


		// -------------------------------------------------------------------------


		/**
		 * リズムをセットする
		 * @param {string} rhythm リズムを表す文字列
		 * @return {Sequencer} このシーケンサー
		 */
		setRhythm(rhythm) {
			rhythm = rhythm.replace(/\|/g, '');
			for (let i = 0; i < rhythm.length; i += 1) {
				const v = (i % 4 < 2) ? 8 / this._swingRatio : 8 / (1 - this._swingRatio);
				const dur = (4 * (60 / this._bpm) * (1 / v));

				const ch = rhythm[i];
				if ('0123456789'.indexOf(ch) !== -1) {
					const vol = parseInt(ch);
					const gain = this._gain * vol / 9;
					const fn = (e) => {
						if (this._tune) this._tune(this._inst, e.time, gain, 440);
						if (this._play) this._play(this._inst, e.time);
						if (this._stop) this._stop(this._inst, e.time + dur);
					};
					this._buf.push([this._lastTime, fn]);
				}
				this._lastTime += dur;
			}
			return this;
		}

	}

	Sequencer.NOTE_TO_BASE_NO = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 };
	Sequencer.RE_PITCH_SHIFT  = /#|\+|-/y;
	Sequencer.RE_NUMBER       = /\d+/y;
	Sequencer.RE_LENGTH       = /\.+|(\d+)(\.*)/y;



	// ライブラリを作る --------------------------------------------------------


	return { Synth, Scheduler, Sequencer };

})();
