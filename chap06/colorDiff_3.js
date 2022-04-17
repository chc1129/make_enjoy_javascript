// クロッキー、スタイル・ライブラリを使う
// @need lib/croqujs lib/style
// パス、定規ライブラリを使う
// @need lib/path lib/ruler
// 計算ライブラリを使う
// @need lib/calc
// カラー、視覚ライブラリを使う
// @need lib/color lib/vision

const pairs = [
	[[250, 100, 100], [250, 150, 50]],
	[[100, 250, 100], [150, 250, 50]],
];

// 準備する
const setup = function () {
	// 紙を作って名前を「p」に
	const p = new CROQUJS.Paper(256, 256);
	draw(p);

	for (const pair of pairs) {
		const d_rgb = VISION.distance(pair[0], pair[1]);
		console.log(d_rgb);
		const lab0 = COLOR.convert(pair[0], "rgb", "lab");
		const lab1 = COLOR.convert(pair[1], "rgb", "lab");
		const d_lab = VISION.distance(lab0, lab1);
		console.log(d_lab);
	}
};

// 絵を描く（紙）
const draw = function (p) {
	const ruler = p.getRuler();  // 定規をもらう
	for (let y = 0; y < 2; y += 1) {
		for (let x = 0; x < 2; x += 1) {
			ruler.fill().rgb(...pairs[y][x]);
			ruler.rect(x * 128, y * 128, 128, 128).draw("fill");
		}
	}
};
