// クロッキー, スタイル・ライブラリを使う
// @need lib/croqujs lib/style
// パス、カメ・ライブラリを使う
// @need lib/path lib/turtle

// 準備する
const setup = function () {
    // 紙を作って名前を「p」に
    const p = new CROQUJS.Paper(600, 600);
    p.translate(300, 300);
    // カメを作って名前を「t」に
    const t = new TURTLE.Turtle(p);
    t.visible(true);  // カメが見えるか
    p.animate(draw, [p, t]);  // アニメーションする
};

// 絵を描く(紙, カメ)
const draw = function (p, t) {
    p.styleClear().color("white").draw(); // 消す
    t.home();  // ホームに帰る

    t.mode("stroke");  // モードを設定
    t.fill();  // ぬりスタイル
    t.stroke();  // 線スタイル
    t.edge(PATH.normalEdge());  // エッジを設定

    t.pd();  // ペンを下ろす

    t.go(100).tl(72);
    t.go(100).tl(72);
    t.go(100).tl(72);
    t.go(100).tl(72);
    t.go(100);

    t.pu();  // ペンを上げる
    t.stepNext(1);  // カメのアニメを進める
};