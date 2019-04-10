/*
                          _____ 1 ____
                   ______/            \______
              _ 01 _                          11
            _/      \_                    _/      \_
        001            011            101            111
       /   \          /   \          /   \          /   \
    0001   0011    0101   0111    1001   1011    1101    1111
*/

// const adj = (orig: string, b: string) => {
//     return orig.slice(0, orig.length - 1) + b + orig.slice(orig.length - 1);
// };

// export default function (frontOrder: null | string, endOrder: null | string) {
//     let order: string;
//     if (frontOrder && !endOrder) {
//         order = "1";
//     } else if (!frontOrder) {
//         order = adj(endOrder!, "0");
//     } else if (!endOrder) {
//         order = adj(frontOrder, "1");
//     } else if (frontOrder.length > endOrder.length) {
//         order = adj(frontOrder, "1");
//     } else {
//         order = adj(endOrder, "0");
//     }
//     return order;
// }
