import crypto from "crypto";

//function code taken from http://blog.tompawlak.org/how-to-generate-random-values-nodejs-javascript
export function randomValueHex(len: number) {
  return crypto
    .randomBytes(Math.ceil(len / 2))
    .toString("hex") // convert to hexadecimal format
    .slice(0, len)
    .toUpperCase(); // return required number of characters
}
