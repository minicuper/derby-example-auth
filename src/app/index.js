var derby = require('derby');
var app = module.exports = derby.createApp('auth', __filename);


global.app = app;

app.use(require('d-bootstrap'));


app.loadViews (__dirname+'/../../views');
app.loadStyles(__dirname+'/../../styles');

app.get('*', function(page, model, params, next){

  var user = 'auths.' + model.get('_session.userId');
  model.subscribe(user, function(){
    model.ref('_page.user', user);
    next();
  });

});

app.get('/', function (page, model){
  page.render('home');
});

app.get('/login', function (page, model){
  page.render('login');
});

