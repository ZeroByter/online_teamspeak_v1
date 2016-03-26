<link rel="stylesheet" type="text/css" href="client.css">

<script type="text/javascript" src="/jsscripts/cookie.js"></script>
<script type="text/javascript" src="jquery-2.2.0.min.js"></script>

<body>
	<text id="title">Browser Teamspeak version 1.0</text>
	<button id="disconnect">Disconnect from server</button>
	<div id="channels_div"></div>
	<div id="chat_div"></div>
	<input id="chat_input" placeholder="Click on me, type your message, and press enter to send..."></input>
	<div id="information_div">
		<center>
			<h1>Welcome to browser teamspeak version 1.0!</h1>
		</center>
	</div>
	
	<div id="channel_context_menu">
		<div class="ctx_menu_btn">
			<button id="cntx_switch_channel">Switch channel</button>
		</div>
		<div class="ctx_menu_btn">
			<button>Add channel after</button>
		</div>
		<div class="ctx_menu_btn">
			<button>Delete channel</button>
		</div>
		<div class="ctx_menu_btn">
			<button>Make channel default</button>
		</div>
		<div class="ctx_menu_btn">
			<button>Kick everyone out of channel</button>
		</div>
	</div>
	
	<div id="user_context_menu">
		<div class="ctx_menu_btn">
			<button id="ctx_kick_user">Kick user</button>
		</div>
		<div class="ctx_menu_btn">
			<button id="ctx_bring_user">Bring user to channel</button>
		</div>
		<div class="ctx_menu_btn">
			<button id="ctx_pmsg_user">Private message user</button>
		</div>
	</div>
</body>

<script type="text/javascript" src="/client.js"></script>
<script type="text/javascript" src="/client_context_functions.js"></script>