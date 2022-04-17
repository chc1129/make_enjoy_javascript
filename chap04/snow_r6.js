// クロッキー、スタイル・ライブラリを使う
// @need lib/croqujs lib/style
// パス、カメ・ライブラリを使う
// @need lib/path lib/turtle
// 計算ライブラリを使う
// @need lib/calc

// 準備する
const setup = function () {
	// 紙を作って名前を「p」に
	const p = new CROQUJS.Paper(600, 600);
	p.translate(300, 300);  // 紙の中心をずらす
	// カメを作って名前を「t」に
	const t = new TURTLE.Turtle(p);
	t.visible(true);  // カメが見えるか

	p.animate(draw, [p, t]);  // アニメーションする
};

// 絵を描く（紙、カメ）
const draw = function (p, t) {
	p.styleClear().color("Black").draw();  // 消す
	t.home();  // ホームに帰る
	t.step(25);  // 1歩の長さを設定
// 	t.stroke().color("White");  // 線スタイル（テスト用）
// 	drawSnowPart(t);
	drawSnowFlake(t);
	t.stepNext(5);  // カメのアニメを進める
};

// 雪の結晶を描く（カメ）
const drawSnowFlake = function (t) {
	t.mode("fillStroke");  // モードを設定
	t.fill();  // ぬりスタイル
	t.stroke();  // 線スタイル
	t.edge(PATH.normalEdge());  // エッジを設定

	for (let i = 0; i < 6; i += 1) {
		t.fill().rgb(15 + i * 40, 255, 255, 0.5);  // ぬりスタイル
		t.stroke();  // 線スタイル
		t.step(20);  // 1歩の長さを設定
		drawSnowPart(t);
		t.tr(60);
	}
};

// 雪の結晶の部品を描く（カメ）
const drawSnowPart = function (t) {
	const N = Math.sqrt(3);  // ななめ
	t.save();  // カメの状態を覚えておく
	t.pd();  // ペンを下ろす

	t.tl(30);
	t.go(N * 4);
	t.tr(90);
	t.go(2);
	t.tl(60);
	t.go(2);
	t.tr(60);
	t.go(2);

	t.tr(60);
	t.go(2);
	t.tr(60);
	t.go(2);
	t.tl(60);
	t.go(2);
	t.tr(90);
	t.go(N * 4);

	t.pu();  // ペンを上げる
	t.restore();  // カメの状態を元に戻す
};
