// クロッキー、スタイル・ライブラリを使う
// @need lib/croqujs lib/style
// 計算ライブラリを使う
// @need lib/calc
// ウィジェット・ライブラリを使う
// @need lib/widget
// シンセ、パッチ、アナライザー・ライブラリを使う
// @need lib/synth lib/patch lib/analyzer

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
	// 楽器を作る
	const inst = make(s, ws, ss);

	// 紙を作る
	const p = new CROQUJS.Paper(200, 200);
	p.styleClear().color("White").draw();  // 消す
	p.onMouseDown(function (x, y) {  // ボタンが押されたとき
		play(inst, s.time());
	});
	p.onMouseMove(function (x, y) {  // マウスが動いたとき
		const gain = CALC.map(y, 200, 0, 0, 1);
		const freq = CALC.map(x, 0, 200, 0, 1000);
		const v0 = sl0.value();
		const v1 = sl1.value();
		const v2 = sl2.value();
		tune(inst, s.time(), gain, freq, v0, v1, v2);
	});
	p.onMouseUp(function () {  // ボタンが離されたとき
		stop(inst, s.time());
	});
};

// 楽器を作る（シンセ、波形スコープ、スペクトル・スコープ）
const make = function (s, ws, ss) {
	// オシレーター・パッチを作る
	const osc = s.makeOsc({ type: "square" });

	const bpf1 = s.makeFilter({ type: "bandpass", Q: 10 });
	const bpf2 = s.makeFilter({ type: "bandpass", Q: 10 });

	// スコープ・パッチを波形用、スペクトル用それぞれ作る
	const spec = s.makeScope({ widget: ss });
	const wave = s.makeScope({ widget: ws });

	// パッチをつなげる
	s.connect(osc, [bpf1, bpf2], wave, spec, s.speaker());
	// まとめて返す
	return { osc, bpf1, bpf2 };
};

// 楽器を鳴らす（楽器、時刻）
const play = function (inst, t) {
	inst.osc.play(t);
};

// 楽器を設定する（楽器、時刻、ゲイン、周波数）
const tune = function (inst, t, g, f, sg, sf1, sf2) {
	inst.osc.gain(g, t);
	inst.osc.freq(f, t);
	inst.bpf1.freq(sf1, t);
	inst.bpf2.freq(sf2, t);
};

// 楽器を止める（楽器、時刻）
const stop = function (inst, t) {
	inst.osc.stop(t);
};
