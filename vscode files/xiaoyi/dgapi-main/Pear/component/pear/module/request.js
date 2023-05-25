layui.define(['jquery', 'layer'], function (exports) {
    var $ = layui.jquery,
        layer = layui.layer;

    var request = {
        get: function (url, params, success, complete = this.complete()) {
            $.ajax({
                url: url,
                type: "GET",
                data: params,
                dataType: 'json',
                xhrFields: {
                    withCredentials: true
                },
                headers: {
                    'token': localStorage.token
                },
                success: success,
                error: this.error,
                complete: complete
            })
        },
        post: function (url, params, success, complete = this.complete()) {
            $.ajax({
                url: url,
                type: "POST",
                // headers: { "Content-Type": "application/x-www-form-urlencoded" },
                dataType: 'json',
                contentType: 'application/json; charset=UTF-8',
                data: JSON.stringify(params),
                beforeSend: function (XMLHttpRequest) {
                    XMLHttpRequest.setRequestHeader("token", localStorage.token);
                },
                success: success,
                error: this.error,
                complete: complete
            })
        },
        put: function (url, params, success, complete = this.complete()) {
            $.ajax({
                url: url,
                type: "PUT",
                dataType: 'json',
                contentType: 'application/json; charset=UTF-8',
                data: JSON.stringify(params),
                beforeSend: function (XMLHttpRequest) {
                    XMLHttpRequest.setRequestHeader("token", localStorage.token);
                },
                success: success,
                error: this.error,
                complete: complete
            })
        },
        delete: function (url, params, success, complete = this.complete()) {
            $.ajax({
                url: url,
                type: "DELETE",
                dataType: "json",
                contentType: "application/json", 
                data: JSON.stringify(params), 
                beforeSend: function (XMLHttpRequest) {
                    XMLHttpRequest.setRequestHeader("token", localStorage.token);
                },
                success: function (result) {

                },
                success: success,
                error: this.error,
                complete: complete
            });
        },
        error: function (res) {
            console.log("触发ajax error...")
            layer.alert('发生未知错误', { icon: 2 });
        },
        complete: function (res) { }
    }
    exports('request', request);
});