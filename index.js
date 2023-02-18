
const Redis = require("ioredis");
const redis = new Redis({});
const SAVE_KEY = "RANKLIST";
const MAX_32BIT = Math.pow(2, 31) - 1;

async function main() {
    try {
        let unixtime1 = Math.floor(Date.now() / 1000) - 60;
        console.log('unixtime1', unixtime1);
        await SaveScore("aa", 1000000, unixtime1);
        await SaveScore("ab", 950000, unixtime1);
        let unixtime2 = Math.floor(Date.now() / 1000);
        await SaveScore("ac", 950000, unixtime2);
        console.log('unixtime2', unixtime2);

        let results = await redis.zrevrange(SAVE_KEY, 0 , -1, "WITHSCORES");
        for (let i = 0; i < results.length; i+=2) {
            let {score, unixtime} = ReadScoreAndUnixSecond(results[i+1]);
            console.log('member: ', results[i], 'score: ', score, 'unix: ', unixtime);
        }
    } catch (err) {
        console.log(err)
    }
}

main();

async function SaveScore(member, score, unixtime) {
  let buf = Buffer.alloc(8); // 8byte
  buf.writeUInt32BE(score, 0); // 4byte
  buf.writeUInt32BE(MAX_32BIT - unixtime, 4); // 4byte
  let value = buf.readBigInt64BE(0);
  try {
    await redis.zadd(SAVE_KEY, value, member);
  } catch (err) {
    throw err;
  }
}

function ReadScoreAndUnixSecond(value) {
  let score = Number(BigInt(value) >> 32n);
  let unixtime = MAX_32BIT - Number(BigInt.asUintN(32, (BigInt(value) << 32n) >> 32n));
  return { score, unixtime };
}



