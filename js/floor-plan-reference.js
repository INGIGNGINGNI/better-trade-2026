/* Pixel landmarks in images/floor-plan.webp (1829 × 1386).
   Keep these in image coordinates so the reconstruction can be checked against
   the actual silhouette. Hidden surfaces are still inferred, not measured. */
export const reference = {
    width: 1829, height: 1386, origin: [907, 574], pixelsPerUnit: 28,
    theta: 0.772, phi: 0.887,
    perimeter: [
        [852, 105], [900, 78], [1335, 307], [1398, 298], [1818, 527],
        [1195, 920], [1439, 1058], [1685, 890], [1828, 970],
        [1205, 1384], [1159, 1359], [1144, 1121], [1088, 1089],
        [1164, 1037], [754, 789], [562, 903], [9, 570], [278, 411], [355, 420],
    ],
    // Clockwise: back left, back right, front right, front left.
    zones: {
        capital: [[990, 627], [1332, 820], [1258, 880], [905, 680]],
        alternative: [[1485, 414], [1745, 556], [1663, 608], [1403, 465]],
        commodity: [[1199, 412], [1359, 502], [1283, 551], [1111, 467]],
        crypto: [[1077, 485], [1244, 580], [1152, 629], [993, 539]],
        health1: [[1405, 524], [1489, 570], [1413, 625], [1324, 577]],
        health2: [[1518, 588], [1609, 636], [1533, 689], [1440, 641]],
        capitalSmall: [[1403, 666], [1494, 716], [1408, 775], [1314, 723]],
    },
    cyan: [
        { corners: [[803, 778], [1122, 963], [1088, 983], [780, 805]], count: 8 },
        { corners: [[1642, 920], [1680, 936], [1551, 1025], [1516, 1004]], count: 4, acrossDepth: true },
        { corners: [[1449, 1176], [1471, 1207], [1419, 1239], [1387, 1218]], count: 2, acrossDepth: true },
        { corners: [[1328, 1258], [1363, 1280], [1299, 1323], [1264, 1301]], count: 2, acrossDepth: true },
        { corners: [[1159, 1210], [1207, 1210], [1212, 1304], [1164, 1305]], count: 3, acrossDepth: true },
    ],
};

export function fromReference(px, py, height = 0) {
    const { theta, phi, pixelsPerUnit: s, origin } = reference;
    const a = s * Math.cos(theta), b = -s * Math.sin(theta);
    const c = s * Math.cos(phi) * Math.sin(theta), d = s * Math.cos(phi) * Math.cos(theta);
    const dx = px - origin[0], dy = py - origin[1] + s * Math.sin(phi) * height;
    return [(dx * d - b * dy) / (a * d - b * c), height, (a * dy - c * dx) / (a * d - b * c)];
}
