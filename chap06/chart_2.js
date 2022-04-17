// クロッキー、スタイル・ライブラリを使う
// @need lib/croqujs lib/style
// ウィジェット・ライブラリを使う
// @need lib/widget
// カラー・ライブラリを使う
// @need lib/color

// 準備する
const setup = function () {
	// スライダーを作って名前を「sl」に
	const sl = new WIDGET.Slider(0, 255, 0);
	// 紙を作って名前を「p」に
	const p = new CROQUJS.Paper(256, 256);

	draw(p, sl.value());
	const listener = function () {  // イベント・リスナーを作る
		draw(p, sl.value());
	};
	sl.onChange(listener);  // スライダーの値が変わったとき
};

// 絵を描く（紙、スライダーの値）
const draw = function (p, value) {
	p.styleClear().color("Gray").draw();  // 消す
	drawChartRGB(p, value);
// 	drawChartLab(p, value / 255);
// 	drawChartXYZ(p, value / 255);
// 	drawChartYxy(p, value / 255);
};

// RGBチャートを描く（紙、緑色0～255）
const drawChartRGB = function (p, g) {
	for (let y = 0; y < 256; y += 1) {
		for (let x = 0; x < 256; x += 1) {
			p.setPixel(x, y, [x, 127, y]);  // ピクセルの色を設定する
		}
	}
};

// L*a*b*チャートを描く（紙、割合0～1）
const drawChartLab = function (p, r) {
	const L = r * 100;
	for (let y = 0; y < 256; y += 1) {
		for (let x = 0; x < 256; x += 1) {
			const c = COLOR.convert([L, x - 128, y - 128], "lab");
			if (COLOR.RGB.isSaturated) {
				continue;
			}
			p.setPixel(x, y, c);  // ピクセルの色を設定する
		}
	}
};

// XYZチャートを描く（紙、割合0～1）
const drawChartXYZ = function (p, r) {
	for (let y = 0; y < 256; y += 1) {
		const ry = y / 255;
		for (let x = 0; x < 256; x += 1) {
			const rx = x / 255;
			const c = COLOR.convert([rx, r, ry], "xyz");
			if (COLOR.RGB.isSaturated) {
				continue;
			}
			p.setPixel(x, y, c);  // ピクセルの色を設定する
		}
	}
};

// Yxyチャートを描く（紙、割合0～1）
const drawChartYxy = function (p, r) {
	for (let y = 0; y < 256; y += 1) {
		const ry = y / 255;
		for (let x = 0; x < 256; x += 1) {
			const rx = x / 255;
			const c = COLOR.convert([r, rx, ry], "yxy");
			if (COLOR.RGB.isSaturated) {
				continue;
			}
			p.setPixel(x, y, c);  // ピクセルの色を設定する
		}
	}
};
