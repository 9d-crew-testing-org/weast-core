const mqttlib = require("/home/flynn/weast/encoder/mqttlib");
const { default: mqtt } = require('mqtt');

console.log('we gonna rock unto');
const args = process.argv.slice(2);

function parseRelativeTime(input) {
  if (!input) return null;

  const timeUnits = {
    second: 1000,
    seconds: 1000,
    sec: 1000,
    secs: 1000,
    s: 1000,

    minute: 60 * 1000,
    minutes: 60 * 1000,
    min: 60 * 1000,
    mins: 60 * 1000,
    m: 60 * 1000,

    hour: 60 * 60 * 1000,
    hours: 60 * 60 * 1000,
    hr: 60 * 60 * 1000,
    hrs: 60 * 60 * 1000,
    h: 60 * 60 * 1000,

    day: 24 * 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  const regex = /(\d+\.?\d*)\s*(\w+)/i;
  const match = input.trim().toLowerCase().match(regex);

  if (!match) return null;

  const value = parseFloat(match[1]);
  const unit = match[2];

  for (const [key, multiplier] of Object.entries(timeUnits)) {
    if (unit.startsWith(key)) {
      return value * multiplier;
    }
  }

  return null;
}


if (args.length === 3) {
	console.log('hey wait this is a cue!');
	const cuecode = args[1].replace("!", "/");
	mqttlib.sendI2Playlist(`i2/${args[0]}`, cuecode, args[2], 4, false, 15);
} else if (args.length === 5) {
	console.log('hey wait this is a fake alert!');
	mqttlib.sendFakeAlert(args[4], args[1], args[2], "An alert remains in effect.", args[0], Date.now() + parseRelativeTime(args[3]));
} else {
  mqttlib.exec(args[1], `i2/${args[0]}`);
}

console.log('i2 avenue');
process.exit(0);
