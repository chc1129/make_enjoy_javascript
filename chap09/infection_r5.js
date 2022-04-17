// クロッキー、スタイル・ライブラリを使う
// @need lib/croqujs lib/style
// パス、定規ライブラリを使う
// @need lib/path lib/ruler
// トレーサー、スプライト・ライブラリを使う
// @need lib/tracer lib/sprite
// 計算ライブラリを使う
// @need lib/calc
// ウィジェット・ライブラリを使う
// @need lib/widget

// 準備する
const setup = function () {
	// 紙を作って名前を「p」に
	const p = new CROQUJS.Paper(600, 600);
	// ステージを作って名前を「city」に
	const city = new SPRITE.Stage();
	// そのほかの部品を作る
	const dm = new SPRITE.DensityMap(600, 600, 30);
	city.addObserver(dm);
	const chart = new WIDGET.Chart(600, 144);
	chart.setDigits(0);
	chart.setItems(count(city));
	// 部品をまとめる
	const ps = { chart, dm };

	for (let i = 0; i < 100; i += 1) {
		const h = makeHuman();
		city.add(h);  // 街（ステージ）に追加
		toMoveToCrowdedArea(h, dm);
	}
	for (let i = 0; i < 1; i += 1) {
		const d = city.get(i).data();
		d.sick = 1000;
	}
	p.animate(draw, [p, city, ps]);  // アニメーションする
};

// 絵を描く（紙、街、部品）
const draw = function (p, city, ps) {
	p.styleClear().color("LightBlue").draw();  // 消す

	p.styleFill().color("Purple");
	ps.dm.draw(p, 10);
	ps.chart.addData(count(city));

	city.draw(p, [p]);  // 街（ステージ）を描く
	city.update();  // 街（ステージ）を更新
};

// 人数を数える（街）
const count = function (city) {
	let healthy = 0;  // 健康
	let sick = 0;  // 病気
	let recovered = 0;  // 回復
	for (const h of city) {
		const d = h.data();
		if (0 < d.sick) {
			sick += 1;
		} else if (d.recovered) {
			recovered += 1;
		} else {
			healthy += 1;
		}
	}
	return { healthy, sick, recovered };  // まとめて返す
};

// ヒト（スプライト）を作る
const makeHuman = function () {
	const h = new SPRITE.Sprite(drawHuman);
	h.data({ sick: 0, recovered: false });  // データを設定

	h.x(CALC.random(0, 600));  // x座標を設定
	h.y(CALC.random(0, 600));  // y座標を設定
	h.setRangeX(0, 600, true);  // x座標を制限し、左右をループ
	h.setRangeY(0, 600, true);  // y座標を制限し、上下をループ
	h.direction(CALC.random(0, 360));  // 方向を設定
	h.collisionRadius(10);  // 衝突する半径を設定
	h.onCollision(onCollision);  // 衝突したとき
	h.motion(new TRACER.TraceMotion());
	return h;
};

// ヒトを描く（紙）
const drawHuman = function (p) {
	const d = this.data();  // データを取り出す
	if (0 < d.sick) {
		d.sick -= 1;
		if (d.sick <= 0) {
			d.recovered = true;
		}
	}
	const r = p.getRuler();  // 定規をもらう
	if (d.recovered) {
		r.fill().color("Blue");
	} else {
		r.fill().color("White");
	}
	r.circle(0, 0, 5).draw("fill");
	r.fill().color("Red", d.sick / 1000);
	r.circle(0, 0, 5).draw("fill");
};

// ぶつかったとき（ヒト1、ヒト2）
const onCollision = function (h1, h2) {
	const d1 = h1.data();  // 1人目のデータを取り出す
	const d2 = h2.data();  // 2人目のデータを取り出す
	if (d1.recovered === false && d1.sick <= 0 && d2.sick) {
		d1.sick = 1000;
	}
};

// 混んでいる方向をもとめる（密度マップ、x座標、y座標）
const getCrowdedDirection = function (dm, x, y) {
	let deg = 0;
	let den = 0;
	for (let i = 0; i < 360; i += 5) {
		const d = dm.getDensity(x, y, i, 60);
		if (den < d) {
			den = d;
			deg = i;
		}
	}
	return deg;
};

// 密に集まる（ヒト、密度マップ）
const toMoveToCrowdedArea = function (h, dm) {
	const deg = getCrowdedDirection(dm, h.x(), h.y());
	const m = h.motion();
	m.direction(deg);
	m.go(10);
	m.doLater(toMoveToCrowdedArea, [h, dm]);
};
