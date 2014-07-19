<?php
/*

All Emoncms code is released under the GNU Affero General Public License.
See COPYRIGHT.txt and LICENSE.txt.

---------------------------------------------------------------------
Emoncms - open source energy visualisation
Part of the OpenEnergyMonitor project:
http://openenergymonitor.org

*/
// no direct access
defined('EMONCMS_EXEC') or die('Restricted access');

function dynamic_controller()
{
    global $session, $route, $mysqli;
    $result = false;
    $submenu = false;

    require "Modules/dynamic/dynamic_model.php";
    $dynamic = new Dynamic($mysqli);

    if ($route->format == 'html')
    {
        if ($route->action=='heatpumpexplorer') $result = view("Modules/dynamic/heatpump_view.php",array());
        if ($route->action=='heatingexplorer') $result = view("Modules/dynamic/direct_view.php",array());
    }


    if ($route->format == 'html' && $session['write'])
    {
        $building = (int) $route->subaction;
        if ($building<1) $building = 1;
        $submenu = view("Modules/dynamic/greymenu.php",array());

        if ($route->action=='view') $result = view("Modules/dynamic/dynamic_view.php",array('building'=>$building));  
    }

    if ($route->format == 'json' && $session['write'])
    {  
        if ($route->action == 'save' && $session['write']) $result = $dynamic->save($session['userid'],get('building'),get('data'));
        if ($route->action == 'get' && $session['write']) $result = $dynamic->get($session['userid'], get('building'));
    }

    return array('content'=>$result,'submenu'=>$submenu);
}
