// クロッキー、スタイル・ライブラリを使う
// @need lib/croqujs lib/style
// パス、定規ライブラリを使う
// @need lib/path lib/ruler
// ウィジェット・ライブラリを使う
// @need lib/widget
// カラー、視覚ライブラリを使う
// @need lib/color lib/vision
// センサー・ライブラリを使う
// @need lib/sensor

const colors = {
};

// 準備する
const setup = function () {
	// 紙を作って名前を「p」に
	const p = new CROQUJS.Paper(320, 320);
	// カメラを作って名前を「cam」に
	const cam = new SENSOR.Camera(320, 240);
	cam.start();
	const ps = { cam, pause: false };  // 部品をまとめる

	const btn = new WIDGET.Toggle("S");
	btn.onClick((state) => {
		ps.pause = state;
	});
	p.onMouseClick((x, y) => { mouseClicked(p, x, y); });  // マウスがクリックされたとき
	p.animate(draw, [p, ps]);  // アニメーションする
};

// 絵を描く（紙、部品）
const draw = function (p, ps) {
	if (ps.pause === true) {
		return;
	}
	p.styleClear().color("White").draw();  // 消す
	p.drawImage(ps.cam.getImage(), 0, 0);  // カメラ画像を描く
};

// マウスがクリックされた（紙、x座標、y座標）
const mouseClicked = function (p, x, y) {
	const ruler = p.getRuler();  // 定規をもらう
	const rgb = p.getPixel(x, y);  // ピクセルの色を取得する
	checkColor(rgb);
};

// 色を調べる
const checkColor = function (rgb) {
	console.log("RGB", rgb);
	const lab = COLOR.convert(rgb, "rgb", "lab");
	console.log("Lab", lab);
	const rgbRed = [255, 0, 0];
	const labRed = COLOR.convert(rgbRed, "rgb", "lab");
	const deRed = VISION.distance(lab, labRed);
	console.log(deRed);
	const rgbBlue = [0, 0, 255];
	const labBlue = COLOR.convert(rgbBlue, "rgb", "lab");
	const deBlue = VISION.distance(lab, labBlue);
	console.log(deBlue);

	if (deRed < deBlue) {
		console.log("red?");
	} else {
		console.log("blue?");
	}
};

// 平均色を計算する
const getAverageColor = function (p, x, y) {
};
