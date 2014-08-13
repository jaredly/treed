
demo.preload([
  "https://cdn.firebase.com/js/client/1.0.19/firebase.js"
], function () {
  demo.run({
    title: 'Firebase example',
    pl: new demo.pl.Firebase({
      url: 'https://treed-demo.firebaseio.com'
    }),
    style: ['setup.css']
  });
})

