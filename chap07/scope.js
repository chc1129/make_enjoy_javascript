// クロッキー・ライブラリを使う
// @need lib/croqujs
// シンセ、パッチ、アナライザー・ライブラリを使う
// @need lib/synth lib/patch lib/analyzer

// 準備する
const setup = function () {
	// シンセを作る
	const s = new SYNTH.Synth();
	// 波形スコープを作る
	const ws = new ANALYZER.WaveformScope(600, 300);
	// スペクトル・スコープを作る
	const ss = new ANALYZER.SpectrumScope(600, 300);
	// 楽器を作る
	const inst = make(s, ws, ss);

	// ここで楽器のゲインを設定する
	tune(inst, s.time(), 1);
	play(inst, s.time());
};

// 楽器を作る（シンセ、波形スコープ、スペクトル・スコープ）
const make = function (s, ws, ss) {
	// マイク・パッチを作る
	const mic = s.makeMic();

	// スコープ・パッチを波形用、スペクトル用それぞれ作る
	const wave = s.makeScope({ widget: ws });
	const spec = s.makeScope({ widget: ss });

	// パッチをつなげる
	s.connect(mic, wave, spec);
	// まとめて返す
	return { mic };
};

// 楽器を鳴らす（楽器、時刻）
const play = function (inst, t) {
	inst.mic.play(t);
};

// 楽器を設定する（楽器、時刻、ゲイン）
const tune = function (inst, t, g) {
	inst.mic.gain(g, t);
};

// 楽器を止める（楽器、時刻）
const stop = function (inst, t) {
	inst.mic.stop(t);
};
