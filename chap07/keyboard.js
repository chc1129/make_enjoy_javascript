// クロッキー・ライブラリを使う
// @need lib/croqujs
// 計算ライブラリを使う
// @need lib/calc
// ウィジェット・ライブラリを使う
// @need lib/widget
// シンセ・パッチ・アナライザー・ライブラリを使う
// @need lib/synth lib/patch lib/analyzer
// @use tone
// @use voice

// 準備する
const setup = function () {
	// シンセを作る
	const s = new SYNTH.Synth();
	// 波形スコープを作る
	const ws = new ANALYZER.WaveformScope(500, 100);
	// スペクトル・スコープを作る
	const ss = new ANALYZER.SpectrumScope(500, 100);
	// スライダーを作って名前を「sl0～sl2」に
	const sl0 = new WIDGET.Slider(0, 100);
	const sl1 = new WIDGET.Slider(0, 1000);
	const sl2 = new WIDGET.Slider(500, 2500);

	// スイッチを作って名前を「mode」に
	const mode = new WIDGET.Switch(2, 0, { horizontal: false });
	// 楽器を作る
	const tone = TONE.make(s, ws, ss);
	const voice = VOICE.make(s, ws, ss);
	const insts = { tone, voice };

	// 紙を作る
	const p = new CROQUJS.Paper(200, 200);
	p.onKeyDown(function (ch) {  // キーが押されたとき
		const v0 = sl0.value();
		const v1 = sl1.value();
		const v2 = sl2.value();
		const freq = calcFrequency(ch);
		tune(insts, s.time(), 1, freq, v0, v1, v2);
		play(mode.value(), insts, s.time());
	});
	p.onKeyUp(function () {  // キーが離されたとき
		stop(insts, s.time());
	});
};

// 楽器を鳴らす
const play = function (mode, insts, t) {
	if (mode === 0) {
		TONE.play(insts.tone, t);
	} else {
		VOICE.play(insts.voice, t);
	}
};

// 楽器を設定する
const tune = function (insts, t, f, g, sg, sf1, sf2) {
	TONE.tune(insts.tone, t, f, g, sg, sf1, sf2);
	VOICE.tune(insts.voice, t, f, g, sg, sf1, sf2);
};

// 楽器を止める
const stop = function (insts, t) {
	TONE.stop(insts.tone, t);
	VOICE.stop(insts.voice, t);
};

// 周波数を計算する
const calcFrequency = function (ch) {
	const keys = "zsxdcvgbhnjm,l.;/";  // 使うキーを並べた文字列
	const i = keys.indexOf(ch);  // 押されたキーが文字列の何番目か
	if (i !== -1) {  // 何番目かがわかったら……
		const no = i + 5 * 12;
		const freq = 440 * Math.pow(2, (no - 69) / 12);
		return freq;  // 周波数を返す
	}
	return 0;  // 間違ったキーを押された！
};
