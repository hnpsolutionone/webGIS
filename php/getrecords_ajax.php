<?php
$host         = "localhost";
$username     = "postgres";
$password     = "root";
$dbname       = "postgis_24_sample";
$result = 0;

/* Create connection */
$conn = pg_connect("host=$host dbname=$dbname user=$username password=$password");
/* Check connection */
if (!$conn) {
     die("Connection to database failed: " . $conn->connect_error);
}
$sql = "select * from \"fr-chef_lieu\" cl where cl.insee_com = '" . $_GET['insee_com'][0] . "'";
$result = pg_query($conn, $sql);
$resultArray = pg_fetch_all($result);
echo json_encode($resultArray);
?>
