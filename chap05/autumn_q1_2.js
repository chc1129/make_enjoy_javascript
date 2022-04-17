// クロッキー、スタイル・ライブラリを使う
// @need lib/croqujs lib/style
// パス、カメ・ライブラリを使う
// @need lib/path lib/turtle
// 計算ライブラリを使う
// @need lib/calc
// ウィジェット・ライブラリを使う
// @need lib/widget

// 準備する
const setup = function () {
	// 温度計を作って名前を「th」に
	const th = new WIDGET.Thermometer();
	// 紙を作って名前を「p」に
	const p = new CROQUJS.Paper(600, 600);
	p.translate(300, 450);  // 紙の中心をずらす
	// カメを作って名前を「t」に
	const t = new TURTLE.Turtle(p);
	t.visible(true);  // カメが見えるか

	p.animate(draw, [p, t, th]);  // アニメーションする
};

// 絵を描く（紙、カメ、温度計）
const draw = function (p, t, th) {
	CALC.resetRandomSeed();  // ランダム関数をリセット
	p.styleClear().color("White").draw();  // 消す
// 	console.log(th.value());  // コンソールに温度を表示
	t.home();  // ホームに帰る
// 	drawShape(t);
	drawLeaf(t, th.value());
	t.stepNext(5);  // カメのアニメを進める
};

// 葉を描く（カメ、温度）
const drawLeaf = function (t, d) {
	drawColorMesophyll(t, d);  // 葉肉を描く
};

// 葉肉を描く（カメ、温度）
const drawColorMesophyll = function (t, d) {
	console.log(d);
	t.mode("fill");  // モードを設定
	t.fill().rgb(255, 255, 0);  // ぬりスタイル
	drawShape(t);

	if (d > 30) {
		t.fill().color("Green");
		drawShape(t);
	}
};

// 葉の形を描く（カメ）
const drawShape = function (t) {
	t.save();  // カメの状態を覚えておく
	t.edge(PATH.normalEdge());  // エッジを設定
	t.pd();  // ペンを下ろす

	t.tl(30);
	t.go(180);
	t.tr(60);
	t.go(180);

	t.tr(120);
	t.go(180);
	t.tr(60);
	t.go(180);

	t.pu();  // ペンを上げる
	t.restore();  // カメの状態を元に戻す
};
