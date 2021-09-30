<?php
global $session;
if ($session["write"]) {
    $menu["setup"]["l2"]['dynamic'] = array(
        "name"=>_("Dynamic"),
        "href"=>"dynamic", 
        "order"=>20, 
        "icon"=>"show_chart"
    );
}
