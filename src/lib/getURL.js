module.exports = ( url ) => {
    var cfg = { anystate:true };
    
    var promise = new Promise( (ok, nok) => {
	var tcfg = {};
	tcfg.ok = true;
	tcfg.status = 0;
	tcfg.text = _ => {
	    return new Promise( (ok, nok) => {
		getURL( url, (data, code) => {
		    if( code == 200 || code == 0 )
			ok(data);
		    else
			nok(code);
		}, cfg);
	    } );
	};
	tcfg.arraybuffer = _ => {
	    cfg.arraybuffer = true;
	    return tcfg.text();
	};
				
	ok(tcfg);
    });

    return promise;
};

function getURL( url, cb, cfg )
{
    
    function bindec(v){
	var r = '', cc;
	for( var i = 0; i<v.length; ++i )
	{
	    cc = v.charCodeAt(i);
	    r += String.fromCharCode(cc & 0xFF);
	}
	return r;
    }

    var xhr = new XMLHttpRequest();
    cfg = cfg || {};
    if( cfg.binary )
	xhr.overrideMimeType("text/plain; charset=x-user-defined");
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function()
    {
        if( xhr.readyState == 4 && ( xhr.status == 200 || xhr.status === 0 || cfg.anystate ) )
        {
       		var v = xhr.response || xhr.responseText;
       		if( xhr.status == 0 && v == "" && cfg.proxy ){
       			var domain = url.match(/([^:]*\/\/[^\/]+).*/);
       			if( domain && domain[1].toLowerCase() != location.origin ){
					var altcfg = DOC.mergeTo({}, cfg);
					altcfg.proxy = null;
       				getURL( cfg.proxy + encodeURIComponent(url), function(obj){
						if( !obj ) return;
						obj = JSON.parse(obj);
						var v = obj.contents;
						if( cfg.binary ) v = bindec(v);
						cb( v );
					}, altcfg );
       				return;
       			}
       		}

        	if( cfg.binary ) v = bindec(v);
            cb( v,xhr.status );
        }
    };
    xhr.send();
}
