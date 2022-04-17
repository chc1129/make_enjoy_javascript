/**
 * パッチ・ライブラリー（PATCH）
 *
 * 音を鳴らすための部品を作るライブラリです。
 *
 * @author Takuto Yanagida
 * @version 2021-05-21
 */


/**
 * ライブラリ変数
 */
const PATCH = (function () {

	'use strict';


	// ライブラリ中だけで使用するユーティリティ --------------------------------


	// キー文字列正規化リスト
	const KEY_NORM_LIST = {
		osc  : 'oscillator',
		mic  : 'microphone',
		sin  : 'sine',
		tri  : 'triangle',
		saw  : 'sawtooth',
		sq   : 'square',
		const: 'constant',
		line : 'linear',
		exp  : 'exponential',
		lpf  : 'lowpass',
		hpf  : 'highpass',
		bpf  : 'bandpass',
		wave : 'waveform',
		spec : 'spectrum',
		sync : 'isSynchronized',
		freq : 'frequency',
		freq1: 'frequency1',
		freq2: 'frequency2',
		freq3: 'frequency3',
		env  : 'envelope',
		dur  : 'duration',
		amp  : 'gain',
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

	// 最小値
	const DELAY = 0.001;

	/**
	 * cancelAndHoldAtTimeメソッドの代替
	 * @param {AudioParam} param オーディオ・パラメーター
	 * @param {number} time 時刻 [s]
	 */
	function cancelAndHoldAtTime(param, time) {
		if (param.cancelAndHoldAtTime) {
			param.cancelAndHoldAtTime(time);
		} else {
			const val = param.value;
			param.cancelScheduledValues(time);
			param.setValueAtTime(val, time);
		}
	}

	/**
	 * オーディオ・パラメーターに値を設定する
	 * @param {AudioParam} param オーディオ・パラメーター
	 * @param {number} value 値
	 * @param {number} time 時刻 [s]
	 * @param {string} type 種類
	 */
	function setParam(param, value, time, type) {
		switch (KEY_NORM_LIST[type] ?? type) {
			case 'linear':
				cancelAndHoldAtTime(param, time);
				param.linearRampToValueAtTime(value, time);
				break;
			case 'exponential':
				cancelAndHoldAtTime(param, time);
				param.exponentialRampToValueAtTime(value, time);
				break;
			default:
				cancelAndHoldAtTime(param, time);
				param.setTargetAtTime(value, time, DELAY);
				break;
		}
	}


	// パッチ ------------------------------------------------------------------
	// Patch -------------------------------------------------------------------


	/**
	 * パッチ・ベース
	 * @version 2020-12-16
	 */
	class Patch {

		/**
		 * パッチを作る
		 * @constructor
		 * @param {Synth} synth シンセ
		 */
		constructor(synth) {
			this._synth = synth;
		}

		/**
		 * 接続する
		 * @param {Patch|AudioParam} target 接続先
		 */
		connect(target) {
			if (target instanceof Patch) {
				this.getOutput().connect(target.getInput());
			} else if (target instanceof AudioParam) {
				this.getOutput().connect(target);
			}
		}

	}


	/**
	 * ソース・パッチ
	 * @extends {Patch}
	 * @version 2021-05-21
	 */
	class SourcePatch extends Patch {

		/**
		 * ソース・パッチを作る
		 * @constructor
		 * @param {Synth} synth シンセ
		 */
		constructor(synth) {
			super(synth);
			this._sw = this._synth.context().createGain();
			this._sw.gain.value = 0;
		}

		/**
		 * 再生する
		 * @param {number=} time 時刻
		 */
		play(time = this._synth.time()) {
			cancelAndHoldAtTime(this._sw.gain, time);
			this._sw.gain.setTargetAtTime(0, time, DELAY);
			this._sw.gain.setTargetAtTime(1, time, DELAY);
		}

		/**
		 * 停止する
		 * @param {number=} time 時刻
		 */
		stop(time = this._synth.time()) {
			cancelAndHoldAtTime(this._sw.gain, time);
			this._sw.gain.setTargetAtTime(1, time, DELAY);
			this._sw.gain.setTargetAtTime(0, time, DELAY);
		}

		/**
		 * 出力（オーディオ・ノード）
		 * @return {AudioNode} オーディオ・ノード
		 */
		getOutput() {
			return this._sw;
		}

	}


	/**
	 * オシレーター・パッチ
	 * @extends {SourcePatch}
	 * @version 2021-05-21
	 */
	class OscillatorPatch extends SourcePatch {

		/**
		 * オシレーター・パッチを作る
		 * @constructor
		 * @param {Synth} synth シンセ
		 * @param {object=} [params={}] パラメーター
		 */
		constructor(synth, params) {
			super(synth);
			const { type = 'sine', frequency = 440, detune = 0, gain = 1 } = params;

			this._o = this._synth.context().createOscillator();
			this._g = this._synth.context().createGain();
			this._o.connect(this._g).connect(this._sw);

			this._o.type            = type;
			this._o.frequency.value = frequency;
			this._o.detune.value    = detune;
			this._g.gain.value      = gain;
			this._o.start();
		}


		// -------------------------------------------------------------------------


		/**
		 * 波形の種類
		 * @param {string=} value 波形の種類
		 * @return {string|OscillatorPatch} 波形の種類／このパッチ
		 */
		type(value = null) {
			if (!value) return this._o.type;
			this._o.type = value;
			return this;
		}

		/**
		 * 周波数 [Hz]
		 * @param {number=} value 周波数
		 * @param {number=} time 時刻
		 * @param {string=} type 変更の種類
		 * @return {AudioParam|OscillatorPatch} オーディオ・パラメーター／このパッチ
		 */
		frequency(value = null, time = this._synth.time(), type = null) {
			if (!value) return this._o.frequency;
			setParam(this._o.frequency, value, time, type);
			return this;
		}

		/**
		 * 振動の離調 [セント]
		 * @param {number=} value 離調
		 * @param {number=} time 時刻
		 * @param {string=} type 変更の種類
		 * @return {AudioParam|OscillatorPatch} オーディオ・パラメーター／このパッチ
		 */
		detune(value = null, time = this._synth.time(), type = null) {
			if (!value) return this._o.detune;
			setParam(this._o.detune, value, time, type);
			return this;
		}

		/**
		 * ゲイン
		 * @param {number=} value ゲイン
		 * @param {number=} time 時刻
		 * @param {string=} type 変更の種類
		 * @return {AudioParam|OscillatorPatch} オーディオ・パラメーター／このパッチ
		 */
		gain(value = null, time = this._synth.time(), type = null) {
			if (!value) return this._g.gain;
			setParam(this._g.gain, value, time, type);
			return this;
		}

	}

	assignAlias(OscillatorPatch);


	/**
	 * ノイズ・パッチ
	 * @extends {SourcePatch}
	 * @version 2021-05-21
	 */
	class NoisePatch extends SourcePatch {

		/**
		 * ノイズ・パッチを作る
		 * @constructor
		 * @param {Synth} synth シンセ
		 * @param {object=} [params={}] パラメーター
		 */
		constructor(synth, params = {}) {
			super(synth);
			const { gain = 1 } = params;

			this._p = this._synth.context().createScriptProcessor(NoisePatch.BUFFER_SIZE, 0, 1);
			this._p.onaudioprocess = (e) => { this._process(e); };
			this._g = this._synth.context().createGain();
			this._p.connect(this._g).connect(this._sw);

			this._g.gain.value = gain;
		}

		/**
		 * オーディオ処理イベントに対応してノイズ・データを作成する（ライブラリ内だけで使用）
		 * @private
		 * @param {AudioProcessingEvent} e イベント
		 */
		_process(e) {
			const output = e.outputBuffer.getChannelData(0);
			for (let i = 0; i < NoisePatch.BUFFER_SIZE; i += 1) {
				output[i] = 2 * (Math.random() - 0.5);
			}
		}


		// -------------------------------------------------------------------------


		/**
		 * ゲイン
		 * @param {number=} value ゲイン
		 * @param {number=} time 時刻
		 * @param {string=} type 変更の種類
		 * @return {AudioParam|NoisePatch} オーディオ・パラメーター／このパッチ
		 */
		gain(value = null, time = this._synth.time(), type = null) {
			if (!value) return this._g.gain;
			setParam(this._g.gain, value, time, type);
			return this;
		}

	}

	NoisePatch.BUFFER_SIZE = 2048;

	assignAlias(NoisePatch);


	/**
	 * マイクロフォン・パッチ
	 * @extends {SourcePatch}
	 * @version 2021-05-21
	 */
	class MicrophonePatch extends SourcePatch {

		/**
		 * マイクロフォン・パッチを作る
		 * @constructor
		 * @param {Synth} synth シンセ
		 * @param {object=} [params={}] パラメーター
		 */
		constructor(synth, params = {}) {
			super(synth);
			const { type = 'notch', Q = 12, frequency = 0, gain = 10 } = params;

			this._f = this._synth.context().createBiquadFilter();
			this._g = this._synth.context().createGain();
			this._f.connect(this._g).connect(this._sw);

			navigator.getUserMedia({ audio: true, video: false }, (stream) => {
				this._m = this._synth.context().createMediaStreamSource(stream);
				this._m.connect(this._f);
			}, () => {});

			this._f.type            = type;
			this._f.Q.value         = Q;
			this._f.frequency.value = frequency;
			this._g.gain.value      = gain;
		}


		// -------------------------------------------------------------------------


		/**
		 * フィルターの種類
		 * @param {string=} value フィルターの種類
		 * @return {string|MicrophonePatch} フィルターの種類／このパッチ
		 */
		type(value = null) {
			if (!value) return this._f.type;
			this._f.type = value;
			return this;
		}

		/**
		 * フィルターの周波数 [Hz]
		 * @param {number=} value フィルターの周波数
		 * @param {number=} time 時刻
		 * @param {string=} type 変更の種類
		 * @return {AudioParam|MicrophonePatch} オーディオ・パラメーター／このパッチ
		 */
		frequency(value = null, time = this._synth.time(), type = null) {
			if (!value) return this._o.frequency;
			setParam(this._o.frequency, value, time, type);
			return this;
		}

		/**
		 * フィルターのQ値
		 * @param {number=} value フィルターのQ値
		 * @param {number=} time 時刻
		 * @param {string=} type 変更の種類
		 * @return {AudioParam|MicrophonePatch} オーディオ・パラメーター／このパッチ
		 */
		Q(value = null, time = this._synth.time(), type = null) {
			if (!value) return this._o.Q;
			setParam(this._o.Q, value, time, type);
			return this;
		}

		/**
		 * ゲイン
		 * @param {number=} value ゲイン
		 * @param {number=} time 時刻
		 * @param {string=} type 変更の種類
		 * @return {AudioParam|MicrophonePatch} オーディオ・パラメーター／このパッチ
		 */
		gain(value = null, time = this._synth.time(), type = null) {
			if (!value) return this._g.gain;
			setParam(this._g.gain, value, time, type);
			return this;
		}

	}

	assignAlias(MicrophonePatch);


	/**
	 * バッファー・ソース・パッチ
	 * @extends {SourcePatch}
	 * @version 2021-05-21
	 */
	class BufferSourcePatch extends SourcePatch {

		/**
		 * 音声ファイル・パッチを作る
		 * @constructor
		 * @param {Synth} synth シンセ
		 * @param {object=} [params={}] パラメーター
		 */
		constructor(synth, params = {}) {
			super(synth);
			const { url = null, loop = false, start = 0, end = 0, detune = 0, playbackRate = 1, gain = 1 } = params;

			this._buffer = null;
			if (url) this.loadFile(url);

			this._loop         = loop;
			this._start        = start;
			this._end          = end;
			this._detune       = detune;
			this._playbackRate = playbackRate;

			this._s = null;
			this._g = this._synth.context().createGain();
			this._g.connect(this._sw);

			this._g.gain.value = gain;
		}

		/**
		 * 音声ファイルを読み込む
		 * @param {string} url ファイルのURL
		 */
		async loadFile(url) {
			try {
				const res = await fetch(url);
				const buf = await res.arrayBuffer();
				this._buffer = await this._synth.context().decodeAudioData(buf);
			} catch (e) {
				console.error('BufferSourcePatch: error');
			}
		}

		/**
		 * オーディオ・ノードを実際に作る（ライブラリ内だけで使用）
		 * @private
		 */
		_createNode() {
			const s = this._synth.context().createBufferSource();
			if (this._buffer) s.buffer = this._buffer;

			s.loop      = this._loop;
			s.loopStart = this._start;
			s.loopEnd   = (!this._end && this._buffer) ? this._buffer.duration : this._end;

			s.detune.value       = this._detune;
			s.playbackRate.value = this._playbackRate;

			s.connect(this._g);
			s.onended = () => {
				if (!this._s) return;
				this._s.disconnect(this._g);
				this._s = null;
			};
			this._s = s;
		}

		/**
		 * 再生する
		 * @param {number=} time 時刻
		 */
		play(time = this._synth.time()) {
			if (this._s) return;
			this._createNode();
			if (this._loop) {
				this._s.start(time);
			} else {
				this._s.start(time, this._start, this._end);
			}
			super.play(time);
		}

		/**
		 * 停止する
		 * @param {number=} time 時刻
		 */
		stop(time = this._synth.time()) {
			if (!this._s) return;
			super.stop(time);
			this._s.stop(time);
		}


		// -------------------------------------------------------------------------


		/**
		 * 再生レート
		 * @param {number=} value 再生レート（スピード）
		 * @param {number=} time 時刻
		 * @param {string=} type 変更の種類
		 * @return {AudioParam|BufferSourcePatch} オーディオ・パラメーター／このパッチ
		 */
		playbackRate(value = null, time = this._synth.time(), type = null) {
			if (!value) return this._s.playbackRate;
			setParam(this._s.playbackRate, value, time, type);
			this._playbackRate = value;
			return this;
		}

		/**
		 * 振動の離調 [セント]
		 * @param {number=} value 離調
		 * @param {number=} time 時刻
		 * @param {string=} type 変更の種類
		 * @return {AudioParam|BufferSourcePatch} オーディオ・パラメーター／このパッチ
		 */
		detune(value = null, time = this._synth.time(), type = null) {
			if (!value) return this._s.detune;
			setParam(this._s.detune, value, time, type);
			this._detune = value;
			return this;
		}

		/**
		 * ゲイン
		 * @param {number=} value ゲイン
		 * @param {number=} time 時刻
		 * @param {string=} type 変更の種類
		 * @return {AudioParam|BufferSourcePatch} オーディオ・パラメーター／このパッチ
		 */
		gain(value = null, time = this._synth.time(), type = null) {
			if (!value) return this._g.gain;
			setParam(this._g.gain, value, time, type);
			return this;
		}

	}

	assignAlias(BufferSourcePatch);


	/**
	 * ゲイン・パッチ
	 * @extends {Patch}
	 * @version 2021-05-21
	 */
	class GainPatch extends Patch {

		/**
		 * ゲイン・パッチを作る
		 * @constructor
		 * @param {Synth} synth シンセ
		 * @param {object=} [params={}] パラメーター
		 */
		constructor(synth, params = {}) {
			super(synth);
			const { gain = 1 } = params;

			this._g = this._synth.context().createGain();
			this._g.gain.value = gain;
		}

		/**
		 * 入力（オーディオ・ノード）
		 * @return {AudioNode} オーディオ・ノード
		 */
		getInput() {
			return this._g;
		}

		/**
		 * 出力（オーディオ・ノード）
		 * @return {AudioNode} オーディオ・ノード
		 */
		getOutput() {
			return this._g;
		}


		// -------------------------------------------------------------------------


		/**
		 * ゲイン
		 * @param {number=} value ゲイン
		 * @param {number=} time 時刻
		 * @param {string=} type 変更の種類
		 * @return {AudioParam|GainPatch} オーディオ・パラメーター／このパッチ
		 */
		gain(value = null, time = this._synth.time(), type = null) {
			if (!value) return this._g.gain;
			setParam(this._g.gain, value, time, type);
			return this;
		}

	}

	assignAlias(GainPatch);


	/**
	 * 二次フィルター・パッチ
	 * @extends {Patch}
	 * @version 2021-05-21
	 */
	class BiquadFilterPatch extends Patch {

		/**
		 * 二次フィルター・パッチを作る
		 * @constructor
		 * @param {Synth} synth シンセ
		 * @param {object=} [params={}] パラメーター
		 */
		constructor(synth, params = {}) {
			super(synth);
			const { type = 'lowpass', frequency = 1000, Q = 1 } = params;

			this._f = this._synth.context().createBiquadFilter();

			this._f.type            = type;
			this._f.frequency.value = frequency;
			this._f.Q.value         = Q;
		}

		/**
		 * 入力（オーディオ・ノード）
		 * @return {AudioNode} オーディオ・ノード
		 */
		getInput() {
			return this._f;
		}

		/**
		 * 出力（オーディオ・ノード）
		 * @return {AudioNode} オーディオ・ノード
		 */
		getOutput() {
			return this._f;
		}


		// -------------------------------------------------------------------------


		/**
		 * 種類
		 * @param {string=} value 種類
		 * @return {string|BiquadFilterPatch} 種類／このパッチ
		 */
		type(value = null) {
			if (!value) return this._f.type;
			this._f.type = value;
			return this;
		}

		/**
		 * 周波数 [Hz]
		 * @param {number=} value 周波数
		 * @param {number=} time 時刻
		 * @param {string=} type 変更の種類
		 * @return {AudioParam|BiquadFilterPatch} オーディオ・パラメーター／このパッチ
		 */
		frequency(value = null, time = this._synth.time(), type = null) {
			if (!value) return this._f.frequency;
			setParam(this._f.frequency, value, time, type);
			return this;
		}

		/**
		 * Q値
		 * @param {number=} value Q値
		 * @param {number=} time 時刻
		 * @param {string=} type 変更の種類
		 * @return {AudioParam|BiquadFilterPatch} オーディオ・パラメーター／このパッチ
		 */
		Q(value = null, time = this._synth.time(), type = null) {
			if (!value) return this._f.Q;
			setParam(this._f.Q, value, time, type);
			return this;
		}

	}

	assignAlias(BiquadFilterPatch);


	/**
	 * エンベロープ・パッチ
	 * @extends {Patch}
	 * @version 2021-05-21
	 */
	class EnvelopePatch extends Patch {

		/**
		 * エンベロープ・パッチを作る
		 * @constructor
		 * @param {Synth} synth シンセ
		 * @param {object=} [params={}] パラメーター
		 */
		constructor(synth, params = {}) {
			super(synth);
			const { attack = 0.02, decay = 0.4, sustain = 0.05, release = 0.8 } = params;

			this._g = this._synth.context().createGain();
			this._g.gain.value = 0;

			this._attack  = attack;
			this._decay   = decay;
			this._sustain = sustain;
			this._release = release;
		}

		/**
		 * 入力（オーディオ・ノード）
		 * @return {AudioNode} オーディオ・ノード
		 */
		getInput() {
			return this._g;
		}

		/**
		 * 出力（オーディオ・ノード）
		 * @return {AudioNode} オーディオ・ノード
		 */
		getOutput() {
			return this._g;
		}


		// -------------------------------------------------------------------------


		/**
		 * 音を鳴らす
		 * @param {number=} time 時刻
		 */
		on(time = this._synth.time()) {
			// Reset to 0;
			this._g.gain.setTargetAtTime(0, time, DELAY);

			// 0 -> Attack
			this._g.gain.linearRampToValueAtTime(1, time + this._attack);
			// Decay -> Sustain
			this._g.gain.setTargetAtTime(this._sustain, time + this._attack, this._decay);
			return this;
		}

		/**
		 * 音を止める
		 * @param {number=} time 時刻
		 */
		off(time = this._synth.time()) {
			this._g.gain.cancelScheduledValues(time);
			// Release -> 0
			this._g.gain.setTargetAtTime(0, time, this._release);
			return this;
		}

	}

	assignAlias(EnvelopePatch);


	/**
	 * スコープ・パッチ
	 * @extends {Patch}
	 * @version 2021-05-21
	 */
	class ScopePatch extends Patch {

		/**
		 * スコープ・パッチを作る
		 * @constructor
		 * @param {Synth} synth シンセ
		 * @param {object=} [params={}] パラメーター
		 */
		constructor(synth, params = {}) {
			super(synth);
			const { widget = null, isSynchronized = true, smoothingTimeConstant = 0.9 } = params;

			this._g = this._synth.context().createGain();
			const a = this._createAnalyser(widget);
			this._g.connect(a);

			widget.setSynchronized(isSynchronized);
			a.smoothingTimeConstant = smoothingTimeConstant;
		}

		/**
		 * アナライザーを作る（ライブラリ内だけで使用）
		 * @param {object} widget ウィジェット
		 * @private
		 */
		_createAnalyser(widget) {
			for (const wap of ScopePatch._WIDGET_ANALYSER_PAIRS) {
				if (wap[0] === widget) {
					return wap[1];
				}
			}
			const a = this._synth.context().createAnalyser();
			ScopePatch._WIDGET_ANALYSER_PAIRS.push([widget, a]);
			widget.setDataSource(new DataSource(a));
			return a;
		}

		/**
		 * 入力（オーディオ・ノード）
		 * @return {AudioNode} オーディオ・ノード
		 */
		getInput() {
			return this._g;
		}

		/**
		 * 出力（オーディオ・ノード）
		 * @return {AudioNode} オーディオ・ノード
		 */
		getOutput() {
			return this._g;
		}


		// -------------------------------------------------------------------------


		/**
		 * スムージング時間定数
		 * @param {number=} value 定数
		 * @return {number|ScopePatch} 定数／このパッチ
		 */
		smoothingTimeConstant(value = null) {
			if (!value) return this._a.smoothingTimeConstant;
			this._a.smoothingTimeConstant = value;
			return this;
		}

	}
	ScopePatch._WIDGET_ANALYSER_PAIRS = [];

	assignAlias(ScopePatch);

	/**
	 * データ・ソース（ライブラリ内だけで使用）
	 * @private
	 * @version 2020-12-08
	 */
	class DataSource {

		constructor(a) {
			this._a = a;
		}

		size() {
			return this._a.fftSize;
		}

		sampleRate() {
			return this._a.context.sampleRate;
		}

		getTimeDomainData(ret) {
			this._a.getByteTimeDomainData(ret);
		}

		getFrequencyData(ret) {
			this._a.getByteFrequencyData(ret);
		}

		minDecibels() {
			return this._a.minDecibels;
		}

		maxDecibels() {
			return this._a.maxDecibels;
		}

	}


	/**
	 * スピーカー・パッチ
	 * @extends {Patch}
	 * @version 2021-05-21
	 */
	class SpeakerPatch extends Patch {

		/**
		 * スピーカー・パッチを作る
		 * @constructor
		 * @param {Synth} synth シンセ
		 * @param {object=} [params={}] パラメーター
		 */
		constructor(synth, params = {}) {
			super(synth);
			const { gain = 1 } = params;

			this._g = this._synth.context().createGain();
			this._g.connect(this._synth.context().destination);

			this._g.gain.value = gain;
		}

		/**
		 * 入力（オーディオ・ノード）
		 * @return {AudioNode} オーディオ・ノード
		 */
		getInput() {
			return this._g;
		}


		// -------------------------------------------------------------------------


		/**
		 * ゲイン
		 * @param {number=} value ゲイン
		 * @param {number=} time 時刻
		 * @param {string=} type 変更の種類
		 * @return {AudioParam|SpeakerPatch} オーディオ・パラメーター／このパッチ
		 */
		gain(value = null, time = this._synth.time(), type = null) {
			if (!value) return this._g.gain;
			setParam(this._g.gain, value, time, type);
			return this;
		}

	}

	assignAlias(SpeakerPatch);


	// ライブラリを作る --------------------------------------------------------


	return {
		Patch,
		SourcePatch,

		OscillatorPatch,
		NoisePatch,
		MicrophonePatch,
		BufferSourcePatch,

		GainPatch,
		BiquadFilterPatch,

		EnvelopePatch,
		ScopePatch,
		SpeakerPatch,

		normalizeParams
	};

})();
