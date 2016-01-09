<?php

function model3d_object_access($op = 'view', $args = array()) {
  $type = $args[0];
  $id = $args[1];

  return TRUE;
}

function model3d_object_retrieve($type, $id) {
  module_load_include('inc', 'model3d_integration', 'model3d_integration.pages');
  if ($type == 'scene') {
    $node = node_load($id);
    if ($node->type != 'scene') {
      return services_error(t('Type of node @nid is not a scene.', array('@nid' => $id)));
    }

    model3d_integration_convert_scene_node_to_array($node);
  }
}