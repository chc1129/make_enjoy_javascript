// クロッキー、スタイル・ライブラリを使う
// @need lib/croqujs lib/style
// パス、定規ライブラリを使う
// @need lib/path lib/ruler
// 計算ライブラリを使う
// @need lib/calc
// ウィジェット・ライブラリを使う
// @need lib/widget
// スプライト・ライブラリを使う
// @need lib/sprite

// 準備する
const setup = function () {
	// 紙を作って名前を「p」に
	const p = new CROQUJS.Paper(600, 600);
	// ステージを作って名前を「world」に
	const world = new SPRITE.Stage();
	// トグル・ボタンを作って名前を「button」に
	const button = new WIDGET.Toggle("G");
	// 部品をまとめる
	const ps = { button, G: 9.8, vx: 0, fy: 0 };

	for (let i = 0; i < 10; i += 1) {
		const b = makeBall(ps);
		world.add(b);  // 世界（ステージ）に追加
	}
	const listener = function (key) {  // イベント・リスナーを作る
		if (key === " ") {
			ps.fy = -100000;
		}
		if (key === "ArrowLeft") {
			ps.vx = -10;
		}
		if (key === "ArrowRight") {
			ps.vx = 10;
		}
	};
	p.onKeyDown(listener);  // キーが押されたとき
	p.animate(draw, [p, world, ps]);  // アニメーションする
};

// 絵を描く（紙、世界、部品）
const draw = function (p, world, ps) {
	p.styleClear().color("White").draw();  // 消す

	world.draw(p);  // 世界（ステージ）を描く
	world.update(p.deltaTime());  // 世界（ステージ）を更新
	ps.fy = 0;
};

// ボール（スプライト）を作る（部品）
const makeBall = function (ps) {
	const r = 10;  // 半径
	const m = r * r;  //　質量
	const restitution = 0.5;  // 反発係数

	// 速度
	const vx = 0;
	const vy = 0;
	// 加速度
	const ax = 0;
	const ay = 0;

	const b = new SPRITE.Circle(r);  // 円形スプライトを作る
	b.data({ ps, vx, vy, ax, ay, m, restitution });  // データを設定

	b.ruler().fill();  // ぬりスタイル
	b.ruler().stroke();  // 線スタイル
	b.x(CALC.rand(600));  // x座標を設定
	b.y(CALC.rand(600));  // y座標を設定
	b.motion(update);
	return b;
};

// 現在位置を更新する（スプライト、ミリ秒、x座標、y座標）
const update = function (b, ms, x, y) {
	const data = b.data();  // データを取り出す
	const t = ms / 1000;  // ミリ秒を秒に直す

	// x座標を計算 ----------------

	data.vx = data.ps.vx;

	let nx = x + data.vx * t;

	// y座標を計算 ----------------

	data.ay = 0;
	if (data.ps.button.value()) {
		data.ay = data.ps.G;
	}
	data.ay = data.ay + data.ps.fy / data.m;
	data.vy = data.vy + data.ay * t;

	let ny = y + data.vy * t + 0.5 * data.ay * t * t;
	if (600 < ny) {
		ny = 600;
		data.vy = data.vy * -1 * data.restitution;
	}

	// 座標をまとめて返す
	return [nx, ny];
};
