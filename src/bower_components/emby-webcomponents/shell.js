define([], function() {
    "use strict";
    return {
        openUrl: function(url) {
            window.open(url, "_blank")
        },
        canExec: !1,
        exec: function(options) {
            return Promise.reject()
        }
    }
});