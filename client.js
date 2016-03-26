var user_id = getCookie("user_identity")
var cookie_username = getCookie("username")
var cookie_server_ip = getCookie("server_ip")
var cookie_server_port = getCookie("server_port")
var websocket = new WebSocket("ws://" + cookie_server_ip + ":" + cookie_server_port + "/id:" + encodeURIComponent(user_id) + "id:username:" + encodeURIComponent(cookie_username) + "username:") //Make the websocket connection with identity and username
//var websocket = new WebSocket("ws://" + cookie_server_ip + ":" + cookie_server_port) //Make the websocket connection
//var websocket = new WebSocket("ws://" + cookie_server_ip + ":" + cookie_server_port + "/id:" + user_id + "id:") //Make the websocket connection only with identity

//Client stored settings
var username = ""//The username
var username_min_length = 4 //The minimum length for a username
var own_id = 0 //The user ID for ourselfs
var own_channel_id = 0
var is_admin = false

window.onbeforeunload = function(){
	websocket.onclose = function(){}
	websocket.close()
}

websocket.onopen = function(){ //When the websocket connection opens
	add_chat("system", "", "Connected to server")
	var i = 0
	
	setTimeout(function(){
		var ws_msg = {
			type: "get_own_info",
		}
		websocket.send(JSON.stringify(ws_msg))
	}, i*100)
	
	i++
	setTimeout(function(){
		var ws_msg = {
			type: "get_channels",
		}
		websocket.send(JSON.stringify(ws_msg))
	}, i*100)
	
	i++
	setTimeout(function(){
		var ws_msg = {
			type: "get_users_in_channels",
		}
		websocket.send(JSON.stringify(ws_msg))
	}, i*100)
}

websocket.onerror = function(){ //When the websocket connection crashes
	add_chat("system", "", "Connection error")
}

websocket.onclose = function(event){ //When the websocket connection closes
	var reason = []
	reason[1000] = ""
	reason[1001] = " (going away)"
	reason[1006] = " (server timed out)"
	reason[1011] = " (internal server error)"
	var reason_string = reason[event.code] || ""
	add_chat("system", "", "Connection closed!" + reason_string)
	
	$("#channels_div").html("<br><br><font color=\"red\">Connection closed!</font>")
}

websocket.onmessage = function(event){ //When a websocket message is received
	var ws_msg = JSON.parse(event.data)
	var type = ws_msg.type
	
	console.log("message received -- type: " + type)
	
	if(type == "admin_enter"){
		var valid = ws_msg.valid
		var enabled = ws_msg.enabled
		if(valid){
			if(enabled){
				add_chat("system", "", "Admin access granted and enabled!")
				is_admin = true
			}else{
				add_chat("system", "", "Admin access granted and disabled!")
				is_admin = false
			}
		}else{
			add_chat("error", "", "Admin access denied!")
			is_admin = false
		}
	}
	
	if(type == "get_own_info"){
		username = ws_msg.client_info.username
		own_id = ws_msg.client_info.uid
	}
	
	if(type == "admin_name_change"){
		var uid = ws_msg.uid
		var enabled = ws_msg.enabled
		var name = ws_msg.name
		if(enabled){
			user_change_name(ws_msg.uid, "<b>" + ws_msg.name + " [Admin]</b>")
			user_change_is_admin(ws_msg.uid, 1)
		}else{
			user_change_name(ws_msg.uid, ws_msg.name)
			user_change_is_admin(ws_msg.uid, 0)
		}
	}
	
	if(type == "kick_message"){
		alert(ws_msg.message)
	}
	
	if(type == "system_message"){
		add_chat("system", "", ws_msg.message)
	}
	
	if(type == "private_message"){
		add_chat("private", ws_msg.username, ws_msg.message)
	}
	
	if(type == "global_message"){
		add_chat("global", ws_msg.username, ws_msg.message)
	}
	
	if(type == "error_message"){
		add_chat("error", "", ws_msg.message)
	}
	
	if(type == "user_message"){
		add_chat("user", ws_msg.username, ws_msg.message)
	}
	
	if(type == "get_channels"){
		$.each(ws_msg.channels, function(i, v){
			add_channel(v["name"], i, i == ws_msg.active_channel, v["is_secure"])
		})
	}
	
	if(type == "get_users_in_channel"){
		clear_channel_users(ws_msg.channel)
		$.each(ws_msg.users, function(i, v){
			add_user_to_channel(ws_msg.channel, {
				"id": v["id"],
				"name": v["username"],
				"is_admin": v["is_admin"],
			})
		})
	}
	
	if(type == "get_users_in_channels"){
		$.each(ws_msg.users, function(i, v){
			add_user_to_channel(v["channel"], {
				"id": v["id"],
				"name": v["username"],
				"is_admin": v["is_admin"],
			})
		})
	}
	
	if(type == "user_change_channel"){
		clear_channel_users(ws_msg.channel)
		$.each(ws_msg.users, function(i, v){
			add_user_to_channel(ws_msg.channel, {
				"id": v["id"],
				"name": v["username"],
				"is_admin": v["is_admin"],
			})
		})
	}
	
	if(type == "client_active_channel"){
		$(".active_channel").removeClass("active_channel")
		$(".channel").each(function(i, v){
			if($(this).data("id") == ws_msg.channel){
				$(this).addClass("active_channel")
			}
		})
	}
	
	if(type == "user_change_name"){
		user_change_name(ws_msg.id, ws_msg.new_name)
	}
	
	if(type == "user_connected"){
		add_user_to_channel(ws_msg.channel_id, {
			"id": ws_msg.id,
			"name": ws_msg.username,
			"is_admin": ws_msg.is_admin,
		})
	}
	
	if(type == "remove_user"){
		remove_user(ws_msg.id)
	}
	
	if(type == "clear_channel_users"){
		clear_channel_users(ws_msg.channel)
	}
}

function add_channel(name, id, active_channel, xss_protected){ //Add a channel to the channels div
	var active_channel_str = ""
	if(active_channel){
		active_channel_str = "active_channel"
	}
	$("#channels_div").append("<span class=\"channel " + active_channel_str + "\" data-channel-name=\"" + name + "\" data-id=\"" + id + "\" data-xss-secure=\"" + xss_protected + "\">Channel: " + name + "</span>")
	$("#channels_div").append("<span class=\"channel_users\" data-id=\"" + id + "\"></span>")
	return true
}

function clear_channel_users(channel_id){
	$(".channel_users").each(function(){
		if($(this).data("id") == channel_id){
			$(this).html("")
		}
	})
}

function add_user_to_channel(channel_id, user_properties){
	$(".channel_users").each(function(){
		if($(this).data("id") == channel_id){
			var real_name = user_properties["name"]
			real_name = real_name.replace("<b>", "").replace(" [Admin]</b>", "")
			//real_name = real_name.replace(" [Admin]</b>", "")
			$(this).append("<span class=\"user\" data-id=\"" + user_properties["id"] + "\" data-name=\"" + real_name + "\" data-is-admin=\"" + user_properties["is_admin"] + "\">" + user_properties["name"] + "</span>")
		}
	})
}

function user_change_is_admin(id, is_admin){
	$(".user").each(function(){
		if($(this).data("id") == id){
			$(this).data("is-admin", is_admin)
			console.log($(this).data("is-admin"))
		}
	})
}

function user_change_name(id, new_name){
	$(".user").each(function(){
		if($(this).data("id") == id){
			$(this).html(new_name)
		}
	})
}

function remove_user(id){
	$(".user").each(function(){
		if($(this).data("id") == id){
			$(this).remove()
		}
	})
}

$("body").on("click", ".user", function(e){
	var username = $(e.target).html()
	var channel
	$(".channel").each(function(i, v){
		if($(v).data("id") == own_channel_id){
			channel = $(v).data("channel-name")
		}
	})
	
	$("#information_div").html("")
	$("#information_div").append("Username: " + username + "<br>")
	$("#information_div").append("Channel: " + channel + "<br>")
	$("#information_div").append("Is admin: " + is_admin + "<br>")
})

$("body").on("click", ".channel", function(e){
	var name = $(e.target).data("channel-name")
	var is_secure = $(e.target).data("xss-secure")
	if(is_secure == 1){
		is_secure = "yes"
	}else{
		is_secure = "no"
	}
	var users_inside
	$(".channel_users").each(function(i, v){
		if($(v).data("id") == $(e.target).data("id")){
			users_inside = $(v).children().length
		}
	})
	
	$("#information_div").html("")
	$("#information_div").append("Channel name: " + name + "<br>")
	$("#information_div").append("Is XSS protected: " + is_secure + "<br>")
	$("#information_div").append("Users inside: " + users_inside + "<br>")
})

$("body").on("dblclick", ".channel:not(.active_channel)", function(){
	if(own_channel_id != $(this).data("id")){
		var ws_msg = {
			type: "user_change_channel",
			channel: $(this).data("id"),
		}
		websocket.send(JSON.stringify(ws_msg))
		own_channel_id = $(this).data("id")
	}
})
$("body").mousedown(function(e){
	if($(e.target).hasClass("channel")){
		e.preventDefault()
	}
})

$("#disconnect").click(function(){
	var ws_msg = {
		type: "user_disconnect"
	}
	websocket.send(JSON.stringify(ws_msg))
	setTimeout(function(){
		window.location = "/"
	}, 3000)
})

$("#chat_input").bind("keypress", function(e){ //When a user sends a message via the chat input box
	var code = e.keyCode || e.which
	if(code == 13){
		var input_text = $("#chat_input").val()
		if(input_text.startsWith("/")){ //Was the text a command?
			var command = input_text.split("/") //The command entered
			delete command[0]
			command = command.join("").split(" ")
			command = command[0]
			var args = input_text.split(" ") //The arguments entered, in an array
			delete args[0]
			$.each(args, function(i, v){
				args[i-1] = v
				delete args[i]
			})
			var args_string = input_text.split(" ") //The arguments entered, in a string
			delete args_string[0]
			args_string = args_string.join(" ").replace(" ", "")
			
			if(command == "username"){ //Set username command
				if(args_string.length >= username_min_length){
					var ws_msg = {
						type: "user_change_name",
						name: args_string,
					}
					websocket.send(JSON.stringify(ws_msg))
					
					add_chat("system", "", "Username set to '" + args_string + "' (" + args_string.length + ")")
					username = args_string
					$("#chat_input").val("")
					setCookie("username", args_string, "365")
					return false
				}else{
					add_chat("error", "", "Username must be longer than " + username_min_length + " charachers! The username you entered (" + args_string + ") was " + args_string.length + " long!")
					$("#chat_input").val("/username ")
					return false
				}
			}
			/*if(command == "admin"){ //Admin login command
				var ws_msg = {
					type: "admin_enter",
					password: args_string,
				}
				websocket.send(JSON.stringify(ws_msg))
				$("#chat_input").val("")
				return
			}*/
			if(command == "global"){ //Global chat command
				var ws_msg = {
					type: "global_message",
					message: args_string,
				}
				websocket.send(JSON.stringify(ws_msg))
				$("#chat_input").val("")
				return
			}
			if(command == "kick"){ //Kick chat command
				var ws_msg = {
					type: "kick_user",
					target_name: args_string,
				}
				websocket.send(JSON.stringify(ws_msg))
				$("#chat_input").val("")
				return
			}
			if(command == "bring"){ //Global chat command
				var ws_msg = {
					type: "bring_user",
					target_name: args_string,
				}
				websocket.send(JSON.stringify(ws_msg))
				$("#chat_input").val("")
				return
			}
			if(command == "pmsg"){ //Private message command
				var message = args_string.split(" ")
				delete message[0]
				$.each(message, function(i, v){
					message[i-1] = v
					delete message[i]
				})
				message = message.join(" ")
				var ws_msg = {
					type: "pmsg_user",
					message: message,
					target_name: args[0],
				}
				websocket.send(JSON.stringify(ws_msg))
				$("#chat_input").val("")
				return
			}
			if(command == "test"){ //test command
				var ws_msg = {
					type: "test",
				}
				websocket.send(JSON.stringify(ws_msg))
				add_chat("system", "", "** test function ran **")
				$("#chat_input").val("")
				return
			}
		}
		
		if(input_text == ""){
			add_chat("error", "", "Message must not be empty!")
			$("#chat_input").val("")
			return false
		}
		
		if(username == ""){
			add_chat("error", "", "Please select a username! Type in chat '/username {username}' to select a username!")
			$("#chat_input").val("")
			return false
		}
		
		var ws_msg = {
			type: "user_message",
			message: input_text,
		}
		websocket.send(JSON.stringify(ws_msg))
		$("#chat_input").val("")
		return true
	}
})

var mouse_pos_x, mouse_pos_y, context_menu_pos_x, context_menu_pos_y, context_menu_target
$("body").mousemove(function(event){
	mouse_pos_x = event.pageX
	mouse_pos_y = event.pageY
})

document.addEventListener("contextmenu", function(e){
	var target = e.target
	if($(target).prop("tagName") == "B"){
		target = $(e.target).parent()[0]
	}
	if($(target).hasClass("channel")){
		context_menu_target = target
		$("#channel_context_menu").css("display", "block")
		$("#channel_context_menu").css("left", mouse_pos_x)
		$("#channel_context_menu").css("top", mouse_pos_y)
		$("#user_context_menu").css("display", "none")
		context_menu_pos_x = mouse_pos_x
		context_menu_pos_y = mouse_pos_y
		
		if(own_channel_id == $(target).data("id")){
			$("#cntx_switch_channel").css("display", "none")
		}else{
			$("#cntx_switch_channel").css("display", "inherit")
		}
		
		e.preventDefault()
	}
	if($(target).hasClass("user")){
		context_menu_target = target
		$("#user_context_menu").css("display", "block")
		$("#user_context_menu").css("left", mouse_pos_x)
		$("#user_context_menu").css("top", mouse_pos_y)
		$("#channel_context_menu").css("display", "none")
		context_menu_pos_x = mouse_pos_x
		context_menu_pos_y = mouse_pos_y
		e.preventDefault()
	}
})

setInterval(function(){
	if(mouse_pos_x < context_menu_pos_x - 50){
		$("#channel_context_menu").css("display", "none")
		$("#user_context_menu").css("display", "none")
	}
	if(mouse_pos_x > context_menu_pos_x + 250){
		$("#channel_context_menu").css("display", "none")
		$("#user_context_menu").css("display", "none")
	}
}, 100)

$(".ctx_menu_btn button").click(function(){
	$("#channel_context_menu").css("display", "none")
	$("#user_context_menu").css("display", "none")
})

$(document).click(function(e){
	setTimeout(function(){
		$("#channel_context_menu").css("display", "none")
		$("#user_context_menu").css("display", "none")
	}, 10)
})

function add_chat(type, username, message){ //Add a chat message to the chat box
	if(type == "error"){
		$("#chat_div").append("<p><i><font color=\"red\">" + message + "</font></i></p>")
	}
	if(type == "system"){
		$("#chat_div").append("<p><i>" + message + "</i></p>")
	}
	if(type == "private"){
		$("#chat_div").append("<p><i>" + username + " to you: " + message + "</i></p>")
	}
	if(type == "user"){
		$("#chat_div").append("<p>" + username + ": " + message + "</p>")
	}
	if(type == "global"){
		$("#chat_div").append("<p>" + username + " (GLOBAL): " + message + "</p>")
	}
	
	var height = 0
	$("#chat_div p").each(function(i, value){
		height = height + parseInt($(this).height())
	})
	height = height + ""
	//$("#chat_div").animate({scrollTop: height}, 0)
	$("#chat_div").animate({scrollTop: 99999999999}, 0)
}