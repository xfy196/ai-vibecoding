import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',args:['--no-sandbox'],defaultViewport:{width:800,height:600}});
const p = await b.newPage();
await p.setContent('<canvas id=c width=800 height=600></canvas>');
const out = await p.evaluate(()=>{
  const ctx = document.getElementById('c').getContext('2d');
  const res = {};
  for (const f of ['52px "Songti SC"','bold 52px "Songti SC"','52px Songti SC','52px "PingFang SC"','52px serif']) {
    ctx.font = f; res[f] = ctx.measureText('我').width;
  }
  res.avail = ['Songti SC','STSong','PingFang SC','Hiragino Sans GB','Heiti SC'].filter(x=>document.fonts.check(`52px "${x}"`));
  return res;
});
console.log(out);
await b.close();
