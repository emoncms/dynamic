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
    global $session, $route, $mysqli, $redis;
    $result = false;

    if ($route->format == 'html') {
        if ($route->action=='heatpumpexplorer') $result = view("Modules/dynamic/heatpump_view.php",array());
        if ($route->action=='heatingexplorer') $result = view("Modules/dynamic/direct_view.php",array());
    }

    if ($session['write']) {
        $userid = $session['userid'];
    
        if ($route->action=='view') {
            $route->format == 'html';
            $result = view("Modules/dynamic/dynamic_view.php",array());  
        }
    
        if ($route->action == 'save') {
            $route->format = 'json';
            $redis->set("dynamic:$userid",get('data'));
        }

        if ($route->action == 'get') {
            $route->format = 'json';
            $result = json_decode($redis->get("dynamic:$userid"));
        }
    }

    return array('content'=>$result);
}
