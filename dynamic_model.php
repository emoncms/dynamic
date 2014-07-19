<?php
// no direct access
defined('EMONCMS_EXEC') or die('Restricted access');

class Dynamic
{
    private $mysqli;

    public function __construct($mysqli)
    {
        $this->mysqli = $mysqli;
    }
    
    public function save($userid, $building, $data)
    {
        $userid = (int) $userid;
        $building = (int) $building;
        $data = preg_replace('/[^\w\s-.",:{}\[\]]/','',$data);

        $data = json_decode($data);

        // Dont save if json_Decode fails
        if ($data!=null) {

          $data = json_encode($data);
          $data = $this->mysqli->real_escape_string($data);

          $result = $this->mysqli->query("SELECT `building` FROM dynamic WHERE `userid` = '$userid' AND `building` = '$building'");
          $row = $result->fetch_object();

          if (!$row)
          {
              $this->mysqli->query("INSERT INTO data (`userid`, `building`, `data`) VALUES ('$userid','$building','$data')");
          }
          else
          {
              $this->mysqli->query("UPDATE dynamic SET `data` = '$data' WHERE `userid` = '$userid' AND `building` = '$building'");
          }
          return true;
        }
        else
        {
          return false;
        }
    }
    
    public function get($userid,$building)
    {
        $userid = (int) $userid;
        $building = (int) $building;
        $result = $this->mysqli->query("SELECT `data` FROM dynamic WHERE `userid` = '$userid' AND `building` = '$building'");
        $row = $result->fetch_array();
        if ($row && $row['data']!=null) return json_decode($row['data']); else return '0';
    }
}
