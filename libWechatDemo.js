 /**
  * A simple demo to show how integrating Dynamics CRM with wechat
  * 
  * Author & maintainer: rapidhere@gmail.com, t-qidong@microsoft.com
  * Version: v0.1
  */

(function() {
  var wechat;
  window.wechat = wechat = {};
  // a simple ajax function
  var wechatAjax = function (method, url, data, cb) {
    var req = new XMLHttpRequest();

    req.onload = function (e) {
      var ret = this.response;

      if (ret.errcode) {
        cb('wechat error:[' + ret.errcode + '] ' + ret.errmsg);
      } else {
        cb(null, ret);
      }
    };

    req.onerror = function () {
      cb('xhr error:' + this.statusText);
    };

    req.open(method, url);
    req.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
    req.responseType = 'json';

    req.send(data);
  };

  // lock
  wechat._fetching = false;
  wechat.fetch = function() {
    // check lock
    if(wechat._fetching) return;
    wechat._fetching = true;

    var appId, appSecret;
    
    // get appid from user input
    // NOTE: don't do this in production environment, you should protect you app_secret in the server side
    appId = window.prompt('请输入公众平台ID');
    appSecret = window.prompt('请输入公众平台Secret(注意: 不要在生产环境中这样实践)');

    var _finish = function (err, data) {
      wechat._fetching = false;

      if (err) {
        window.alert("出现错误: " + err);
        return;
      }

      var attr = Xrm.Page.getAttribute('description');
      var content = attr.getValue() || '';
      content += '\n公众平台用户统计:\n\n' + wechat.parseData(data) + '\n';
      attr.setValue(content);
    };

    wechat.getWechatAccessToken(appId, appSecret, function (err, data) {
      if(err) {
        _finish(err);
        return ;
      }

      var accessToken = data.access_token;
      wechat.getUserCumulate(accessToken, function(err, data) {
        if(err) {
          _finish(err);
          return ;
        }

        _finish(null, data);
      });
    });
  };
  
  // helper functions
  var getWechatAccessToken = wechat.getWechatAccessToken = function(appId, appSecret, cb) {
    var url = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential';
    url += '&appid=';
    url += appId;
    url += '&secret=';
    url += appSecret;

    wechatAjax('GET', url, '', cb);
  };
  
  var formatDate = function(date) {
    return date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
  };
  
  var getUserCumulate = wechat.getUserCumulate = function (accessToken, cb) {
    var url = 'https://api.weixin.qq.com/datacube/getusercumulate?access_token=' + accessToken;

    var today = new Date();
    var yesterday = new Date(today - 24 * 3600 * 1000)
    var _7dayAgo = new Date(today - 7 * 24 * 3600 * 1000);
    var data = {
      begin_date: formatDate(_7dayAgo),
      end_date: formatDate(yesterday)
    };
    
    wechatAjax('POST', url, JSON.stringify(data), cb);
  };

  var parseData = wechat.parseData = function (data) {
    var ret = '';

    data.list.forEach(function (ref) {
      ret += '        [' + ref.ref_date + '] ';
      ret += '公众平台用户数 ' + ref.cumulate_user;
      ret += '\n';
    });

    return ret;
  };
})();