<?php
/**
 * Created by PhpStorm.
 * User: neeravbm
 * Date: 12/26/15
 * Time: 9:35 AM
 */

function model3d_integration_save_object($object) {
  $object_node = model3d_integration_create_node('object', $object->name);

  $index = 0;
  foreach ($object->groups as $group) {
    $group_node = model3d_integration_save_group($group);
    $object_node->field_group[LANGUAGE_NONE][$index]['target_id'] = $group_node->nid;
    $index++;
  }

  $object_node->field_vertex_data[LANGUAGE_NONE][0]['value'] = $object->vertex_data;

  node_save($object_node);

  return $object_node;
}

function model3d_integration_save_group($group) {
  $group_node = model3d_integration_create_node('group', $group->name);

  $index = 0;
  foreach ($group->meshes as $mesh) {
    $mesh_node = model3d_integration_save_mesh($mesh);
    $group_node->field_mesh[LANGUAGE_NONE][$index]['target_id'] = $mesh_node->nid;
    $index++;
  }

  $group_node->field_vertex_count[LANGUAGE_NONE][0]['value'] = $group->vertex_count;
  $group_node->field_normal_count[LANGUAGE_NONE][0]['value'] = $group->normal_count;
  $group_node->field_texture_count[LANGUAGE_NONE][0]['value'] = $group->texture_count;

  node_save($group_node);

  return $group_node;
}

function model3d_integration_save_mesh($mesh) {
  $mesh_node = model3d_integration_create_node('mesh', $mesh->name);

  if (!is_null($mesh->material)) {
    $material_node = model3d_integration_save_material($mesh->material);
    $mesh_node->field_material[LANGUAGE_NONE][0]['target_id'] = $material_node->nid;
  }

  $mesh_node->field_face_data[LANGUAGE_NONE][0]['value'] = $mesh->face_data;

  node_save($mesh_node);

  return $mesh_node;
}

function model3d_integration_save_material($material) {
  $material_node = model3d_integration_create_node('material', $material->name);

  if (!empty($material->Ka) && ($color = \Model3D\Utils::toColorHex($material->Ka))) {
    $material_node->field_ka[LANGUAGE_NONE][0]['rgb'] = '#' . $color;
  }

  if (!empty($material->Kd) && ($color = \Model3D\Utils::toColorHex($material->Kd))) {
    $material_node->field_kd[LANGUAGE_NONE][0]['rgb'] = '#' . $color;
  }

  if (!empty($material->Ks) && ($color = \Model3D\Utils::toColorHex($material->Ks))) {
    $material_node->field_ks[LANGUAGE_NONE][0]['rgb'] = '#' . $color;
  }

  if (!empty($material->Ke) && ($color = \Model3D\Utils::toColorHex($material->Ke))) {
    $material_node->field_ke[LANGUAGE_NONE][0]['rgb'] = '#' . $color;
  }

  if (!empty($material->Ni)) {
    $material_node->field_ni[LANGUAGE_NONE][0]['value'] = $material->Ni;
  }

  if (!empty($material->Ns)) {
    $material_node->field_ns[LANGUAGE_NONE][0]['value'] = $material->Ns;
  }

  if (!empty($material->d)) {
    $material_node->field_d[LANGUAGE_NONE][0]['value'] = $material->d;
  }

  if (!empty($material->Tf) && ($color = \Model3D\Utils::toColorHex($material->Tf))) {
    $material_node->field_tf[LANGUAGE_NONE][0]['rgb'] = '#' . $color;
  }

  if (!empty($material->illum)) {
    $material_node->field_illum[LANGUAGE_NONE][0]['value'] = $material->illum;
  }

  if (!is_null($material->map_Ka)) {
    $texture_node = model3d_integration_save_texture($material->map_Ka);
    $material_node->field_map_ka[LANGUAGE_NONE][0]['target_id'] = $texture_node->nid;
  }

  if (!is_null($material->map_Kd)) {
    $texture_node = model3d_integration_save_texture($material->map_Kd);
    $material_node->field_map_kd[LANGUAGE_NONE][0]['target_id'] = $texture_node->nid;
  }

  if (!is_null($material->map_Ks)) {
    $texture_node = model3d_integration_save_texture($material->map_Ks);
    $material_node->field_map_ks[LANGUAGE_NONE][0]['target_id'] = $texture_node->nid;
  }

  if (!is_null($material->map_Ns)) {
    $texture_node = model3d_integration_save_texture($material->map_Ns);
    $material_node->field_map_ns[LANGUAGE_NONE][0]['target_id'] = $texture_node->nid;
  }

  if (!is_null($material->map_d)) {
    $texture_node = model3d_integration_save_texture($material->map_d);
    $material_node->field_map_d[LANGUAGE_NONE][0]['target_id'] = $texture_node->nid;
  }

  if (!is_null($material->bump)) {
    $texture_node = model3d_integration_save_texture($material->bump);
    $material_node->field_bump[LANGUAGE_NONE][0]['target_id'] = $texture_node->nid;
  }

  if (!is_null($material->disp)) {
    $texture_node = model3d_integration_save_texture($material->disp);
    $material_node->field_disp[LANGUAGE_NONE][0]['target_id'] = $texture_node->nid;
  }

  if (!is_null($material->decal)) {
    $texture_node = model3d_integration_save_texture($material->decal);
    $material_node->field_decal[LANGUAGE_NONE][0]['target_id'] = $texture_node->nid;
  }

  if (!is_null($material->refl)) {
    $texture_node = model3d_integration_save_texture($material->refl);
    $material_node->field_refl[LANGUAGE_NONE][0]['target_id'] = $texture_node->nid;
  }

  node_save($material_node);

  return $material_node;
}

function model3d_integration_save_texture($texture) {
  $map_path = $texture->map_path;
  $path_info = pathinfo($map_path);

  global $user;
  $map = file_save_data(file_get_contents($map_path), file_default_scheme() . '://textures/' . $path_info['basename']);
  $map->uid = $user->uid;

  $texture_node = model3d_integration_create_node('texture', $texture->name);;

  $texture_node->field_map[LANGUAGE_NONE][0] = (array) $map;

  node_save($texture_node);

  return $texture_node;
}

/**
 * Create a node object.
 *
 * @param string $type
 *   Node type.
 * @param string $title
 *   Node title.
 *
 * @return stdClass
 */
function model3d_integration_create_node($type, $title = '') {
  $node = new stdClass();
  $node->title = $title;
  $node->language = LANGUAGE_NONE;
  $node->type = $type;
  node_object_prepare($node);
  return $node;
}

function model3d_integration_convert_node_to_array($node) {
  switch ($node->type) {
    case 'object':
      return model3d_integration_convert_object_node_to_array($node);
    case 'product_display':
      return model3d_integration_convert_product_display_node_to_array($node);
    case 'scene':
      return model3d_integration_convert_scene_node_to_array($node);
  }
}

function model3d_integration_convert_scene_node_to_array($scene_node) {
  if ($cache = cache_get('model3d_integration_node_' . $scene_node->nid)) {
    return $cache->data;
  }

  $output = array(
    'type' => 'scene',
    'name' => $scene_node->title,
    'id' => $scene_node->nid,
  );

  $field_scene = field_get_items('node', $scene_node, 'field_scene');
  if (!empty($field_scene[0])) {
    $scene_entity = commerce_product_load($field_scene[0]['product_id']);
    if ($scene_entity->status) {
      $output['scene_entity'] = model3d_integration_convert_scene_product_to_array($scene_entity);
    }
  }

  //cache_set()

  return $output;
}

function model3d_integration_convert_scene_product_to_array($scene_entity) {
  if ($cache = cache_get('model3d_integration_product_' . $scene_entity->product_id)) {
    return $cache;
  }

  $output = array(
    'type' => 'scene_entity',
    'name' => $scene_entity->title,
    'id' => $scene_entity->product_id,
  );

  $objects = array();
  $field_product_display_object_for_scene = field_get_items('commerce_product', $scene_entity, 'field_prod_display_object_scene');
  if (!empty($field_product_display_object_for_scene[0])) {
    foreach ($field_product_display_object_for_scene as $product_display_object_for_scene) {
      $product_display_object_for_scene_node = node_load($product_display_object_for_scene['target_id']);
      if ($product_display_object_for_scene_node->status) {
        $objects[] = model3d_integration_convert_product_display_object_for_scene_node_to_array($product_display_object_for_scene_node);
      }
    }
  }
  $output['objects'] = $objects;

  // cache_set

  return $output;
}

function model3d_integration_convert_product_display_object_for_scene_node_to_array($product_display_object_for_scene_node) {
  if ($cache = cache_get('model3d_integration_' . $product_display_object_for_scene_node->nid)) {
    return $cache->data;
  }

  $output = array(
    'type' => 'object',
    'name' => $product_display_object_for_scene_node->title,
    'id' => $product_display_object_for_scene_node->nid,
  );

  $field_object_for_scene = field_get_items('node', $product_display_object_for_scene_node, 'field_object_for_scene');
  $field_product_display_for_scene = field_get_items('node', $product_display_object_for_scene_node, 'field_product_display_for_scene');
  $field_product_for_scene = field_get_items('node', $product_display_object_for_scene_node, 'field_product_for_scene');
  if (!empty($field_object_for_scene[0]) && !empty($field_product_for_scene[0]) && !empty($field_product_display_for_scene[0])) {
    $object_for_scene_node = node_load($field_object_for_scene[0]['target_id']);
    $product_display_for_scene = node_load($field_product_display_for_scene[0]['target_id']);
    $product_for_scene = commerce_product_load($field_product_for_scene[0]['target_id']);

    if ($object_for_scene_node->status && $product_display_for_scene->status && $product_for_scene->status) {
      $output['object'] = model3d_integration_convert_object_node_to_array($object_for_scene_node);
      $output['product_display_id'] = $field_product_display_for_scene[0]['target_id'];
      $output['product_id'] = $field_product_for_scene[0]['target_id'];
    }

    $operations = array();
    $field_operation = field_get_items('node', $product_display_object_for_scene_node, 'field_operation');
    if (!empty($field_operation[0])) {
      foreach ($field_operation as $operation) {
        $operation_node = node_load($operation['target_id']);
        if ($operation_node->status) {
          $operations[] = model3d_integration_convert_operation_node_to_array($operation_node);
        }
      }
    }
    $output['operations'] = $operations;
  }

  // Cache_set

  return $output;
}

function model3d_integration_convert_product_display_node_to_array($product_display_node) {
  if ($cache = cache_get('model3d_integration_node_' . $product_display_node->nid)) {
    return $cache->data;
  }

  $output = array(
    'type' => 'product_display',
    'name' => $product_display_node->title,
    'id' => $product_display_node->nid,
  );

  $field_product = field_get_items('node', $product_display_node, 'field_product');
  if (!empty($field_product[0])) {
    $product_entity = commerce_product_load($field_product[0]['product_id']);
    if ($product_entity->status) {
      $output['product'] = model3d_integration_convert_product_entity_to_array($product_entity);
    }
  }

  cache_set('model3d_integration_node_' . $product_display_node->nid, $output);

  return $output;
}

function model3d_integration_convert_product_entity_to_array($product_entity) {
  if ($cache = cache_get('model3d_integration_product_' . $product_entity->product_id)) {
    return $cache->data;
  }

  $output = array(
    'type' => 'product',
    'name' => $product_entity->title,
    'id' => $product_entity->product_id,
  );

  $object_for_products = array();
  $field_object_for_product = field_get_items('commerce_product', $product_entity, 'field_object_for_product');
  if (!empty($field_object_for_product[0])) {
    foreach ($field_object_for_product as $object_for_product) {
      $object_for_product_node = node_load($object_for_product['target_id']);
      $object_for_products[] = model3d_integration_convert_object_for_product_node_to_array($object_for_product_node);
    }
  }

  $output['object_for_products'] = $object_for_products;

  cache_set('model3d_integration_product_' . $product_entity->product_id, $output);

  return $output;
}

function model3d_integration_convert_object_for_product_node_to_array($object_for_product_node) {
  if ($cache = cache_get('model_3d_integration_node_' . $object_for_product_node->nid)) {
    return $cache->data;
  }

  $output = array(
    'type' => 'object_for_product',
    'name' => $object_for_product_node->title,
    'id' => $object_for_product_node->nid,
  );

  $field_object = field_get_items('node', $object_for_product_node, 'field_object');
  if (!empty($field_object[0])) {
    $object_node = node_load($field_object[0]['target_id']);
    $output['object'] = model3d_integration_convert_object_node_to_array($object_node);
  }

  $operations = array();
  $field_operation = field_get_items('node', $object_for_product_node, 'field_operation');
  if (!empty($field_operation[0])) {
    foreach ($field_operation as $operation) {
      $operation_node = node_load($operation['target_id']);
      $operations[] = model3d_integration_convert_operation_node_to_array($operation_node);
    }
  }
  $output['operations'] = $operations;

  cache_set('model3d_integration_node_' . $object_for_product_node->nid, $output);

  return $output;
}

function model3d_integration_convert_object_node_to_array($object_node) {
  if ($cache = cache_get('model3d_integration_node_' . $object_node->nid)) {
    return $cache->data;
  }

  $output = array(
    'type' => 'object',
    'name' => $object_node->title,
    'id' => $object_node->nid,
  );

  $vertex_data = field_get_items('node', $object_node, 'field_vertex_data');
  $vertex_data = !empty($vertex_data[0]) ? $vertex_data[0]['value'] : '';
  $vertex_lines = explode(PHP_EOL, $vertex_data);
  $nonempty_vertex_lines = array();
  foreach ($vertex_lines as $line) {
    $line = trim($line);
    if (!empty($line)) {
      $nonempty_vertex_lines[] = $line;
    }
  }
  $output['vertex_data'] = $nonempty_vertex_lines;

  $field_group = field_get_items('node', $object_node, 'field_group');
  $groups = array();
  if (!empty($field_group[0])) {
    foreach ($field_group as $group) {
      $group_node = node_load($group['target_id']);
      if ($group_node->status) {
        $groups[] = model3d_integration_convert_group_node_to_array($group_node);
      }
    }
  }
  $output['groups'] = $groups;

  $field_operation = field_get_items('node', $object_node, 'field_operation');
  $operations = array();
  if (!empty($field_operation[0])) {
    foreach ($field_operation as $operation) {
      $operation_node = node_load($operation['target_id']);
      if ($operation_node->status) {
        $operations[] = model3d_integration_convert_operation_node_to_array($operation_node);
      }
    }
  }
  $output['operations'] = $operations;

  cache_set('model3d_integration_node_' . $object_node->nid, $output);

  return $output;
}

function model3d_integration_convert_operation_node_to_array($operation_node) {
  if ($cache = cache_get('model3d_integration_node_' . $operation_node->nid)) {
    return $cache->data;
  }

  switch ($operation_node->type) {
    case 'translate_operation':
      $field_amount = field_get_items('node', $operation_node, 'field_amount');
      $output = array(
        'type' => 'translate',
        'amount' => $field_amount[0]['value'],
      );
      break;
    case 'scale_operation':
      $field_amount = field_get_items('node', $operation_node, 'field_amount');
      $output = array(
        'type' => 'scale',
        'amount' => $field_amount[0]['value'],
      );
      break;
    case 'rotate_operation':
      $field_axis = field_get_items('node', $operation_node, 'field_amount');
      $field_angle = field_get_items('node', $operation_node, 'field_angle');
      $output = array(
        'type' => 'rotate',
        'axis' => $field_axis[0]['value'],
        'angle' => $field_angle[0]['value'],
      );
      break;
  }

  cache_set('model3d_integration_node_' . $operation_node->nid, $output);

  return $output;
}

function model3d_integration_convert_group_node_to_array($group_node) {
  if ($cache = cache_get('model3d_integration_node_' . $group_node->nid)) {
    return $cache->data;
  }

  $output = array(
    'type' => 'group',
    'name' => $group_node->title,
    'id' => $group_node->nid,
  );

  model3d_integration_extract_value_from_node_into_array($group_node, 'field_vertex_count', $output, 'vertex_count');
  model3d_integration_extract_value_from_node_into_array($group_node, 'field_normal_count', $output, 'normal_count');
  model3d_integration_extract_value_from_node_into_array($group_node, 'field_texture_count', $output, 'texture_count');

  $field_mesh = field_get_items('node', $group_node, 'field_mesh');
  $meshes = array();
  if (!empty($field_mesh[0])) {
    foreach ($field_mesh as $mesh) {
      $mesh_node = node_load($mesh['target_id']);
      if ($mesh_node->status) {
        $meshes[] = model3d_integration_convert_mesh_node_to_array($mesh_node);
      }
    }
  }

  $output['meshes'] = $meshes;

  cache_set('model3d_integration_node_' . $group_node->nid, $output);

  return $output;
}

function model3d_integration_convert_mesh_node_to_array($mesh_node) {
  if ($cache = cache_get('model3d_integration_node_' . $mesh_node->nid)) {
    return $cache->data;
  }

  $output = array(
    'type' => 'mesh',
    'name' => $mesh_node->title,
    'id' => $mesh_node->nid,
  );

  model3d_integration_extract_value_from_node_into_array($mesh_node, 'field_face_data', $output, 'face_data');
  if (!empty($output['face_data'])) {
    $nonempty_face_lines = array();
    foreach (explode(PHP_EOL, $output['face_data']) as $line) {
      $line = trim($line);
      if (!empty($line)) {
        $nonempty_face_lines[] = $line;
      }
    }
    $output['face_data'] = $nonempty_face_lines;
  }

  $field_material = field_get_items('node', $mesh_node, 'field_material');
  if (!empty($field_material[0])) {
    $material_node = node_load($field_material[0]['target_id']);
    if ($material_node->status) {
      $output['material'] = model3d_integration_convert_material_node_to_array($material_node);
    }
  }

  cache_set('model3d_integration_node_' . $mesh_node->nid, $output);

  return $output;
}

function model3d_integration_convert_material_node_to_array($material_node) {
  if ($cache = cache_get('model3d_integration_node_' . $material_node->nid)) {
    return $cache->data;
  }

  $output = array(
    'type' => 'material',
    'name' => $material_node->title,
    'id' => $material_node->nid,
  );

  model3d_integration_extract_color_from_node_into_array($material_node, 'field_ka', $output, 'Ka');
  model3d_integration_extract_color_from_node_into_array($material_node, 'field_kd', $output, 'Kd');
  model3d_integration_extract_color_from_node_into_array($material_node, 'field_ks', $output, 'Ks');
  model3d_integration_extract_color_from_node_into_array($material_node, 'field_ke', $output, 'Ke');
  model3d_integration_extract_color_from_node_into_array($material_node, 'field_tf', $output, 'Tf');

  model3d_integration_extract_value_from_node_into_array($material_node, 'field_d', $output, 'd');
  model3d_integration_extract_value_from_node_into_array($material_node, 'field_ns', $output, 'Ns');
  model3d_integration_extract_value_from_node_into_array($material_node, 'field_ni', $output, 'Ni');
  model3d_integration_extract_value_from_node_into_array($material_node, 'field_illum', $output, 'illum');

  $field = field_get_items('node', $material_node, 'field_map_ka');
  if (!empty($field[0])) {
    $texture_node = node_load($field[0]['target_id']);
    if ($texture_node->status) {
      $output['map_Ka'] = model3d_integration_convert_texture_node_to_array($texture_node);
    }
  }

  $field = field_get_items('node', $material_node, 'field_map_ks');
  if (!empty($field[0])) {
    $texture_node = node_load($field[0]['target_id']);
    if ($texture_node->status) {
      $output['map_Ks'] = model3d_integration_convert_texture_node_to_array($texture_node);
    }
  }

  $field = field_get_items('node', $material_node, 'field_map_kd');
  if (!empty($field[0])) {
    $texture_node = node_load($field[0]['target_id']);
    if ($texture_node->status) {
      $output['map_Kd'] = model3d_integration_convert_texture_node_to_array($texture_node);
    }
  }

  $field = field_get_items('node', $material_node, 'field_map_ns');
  if (!empty($field[0])) {
    $texture_node = node_load($field[0]['target_id']);
    if ($texture_node->status) {
      $output['map_Ns'] = model3d_integration_convert_texture_node_to_array($texture_node);
    }
  }

  $field = field_get_items('node', $material_node, 'field_map_d');
  if (!empty($field[0])) {
    $texture_node = node_load($field[0]['target_id']);
    if ($texture_node->status) {
      $output['map_d'] = model3d_integration_convert_texture_node_to_array($texture_node);
    }
  }

  $field = field_get_items('node', $material_node, 'field_bump');
  if (!empty($field[0])) {
    $texture_node = node_load($field[0]['target_id']);
    if ($texture_node->status) {
      $output['bump'] = model3d_integration_convert_texture_node_to_array($texture_node);
    }
  }

  $field = field_get_items('node', $material_node, 'field_disp');
  if (!empty($field[0])) {
    $texture_node = node_load($field[0]['target_id']);
    if ($texture_node->status) {
      $output['disp'] = model3d_integration_convert_texture_node_to_array($texture_node);
    }
  }

  $field = field_get_items('node', $material_node, 'field_decal');
  if (!empty($field[0])) {
    $texture_node = node_load($field[0]['target_id']);
    if ($texture_node->status) {
      $output['decal'] = model3d_integration_convert_texture_node_to_array($texture_node);
    }
  }

  $field = field_get_items('node', $material_node, 'field_refl');
  if (!empty($field[0])) {
    $texture_node = node_load($field[0]['target_id']);
    if ($texture_node->status) {
      $output['refl'] = model3d_integration_convert_texture_node_to_array($texture_node);
    }
  }

  cache_set('model3d_integration_node_' . $material_node->nid, $output);

  return $output;
}

function model3d_integration_convert_texture_node_to_array($texture_node) {
  if ($cache = cache_get('model3d_integration_node_' . $texture_node->nid)) {
    return $cache->data;
  }

  $output = array(
    'type' => 'texture',
    'name' => $texture_node->title,
    'id' => $texture_node->nid,
  );

  $field_map = field_get_items('node', $texture_node, 'field_map');
  if (!empty($field_map[0])) {
    $output['map_path'] = file_create_url($field_map[0]['uri']);
  }

  model3d_integration_extract_value_from_node_into_array($texture_node, 'field_blendu', $output, 'blendu');
  model3d_integration_extract_value_from_node_into_array($texture_node, 'field_blendv', $output, 'blendv');
  model3d_integration_extract_value_from_node_into_array($texture_node, 'field_bm', $output, 'bm');
  model3d_integration_extract_value_from_node_into_array($texture_node, 'field_boost', $output, 'boost');
  model3d_integration_extract_value_from_node_into_array($texture_node, 'field_cc', $output, 'cc');
  model3d_integration_extract_value_from_node_into_array($texture_node, 'field_clamp', $output, 'clamp');
  model3d_integration_extract_value_from_node_into_array($texture_node, 'field_imfchan', $output, 'imfchan');
  model3d_integration_extract_value_from_node_into_array($texture_node, 'field_mm', $output, 'mm');
  model3d_integration_extract_value_from_node_into_array($texture_node, 'field_o', $output, 'o');
  model3d_integration_extract_value_from_node_into_array($texture_node, 'field_s', $output, 's');
  model3d_integration_extract_value_from_node_into_array($texture_node, 'field_t', $output, 't');
  model3d_integration_extract_value_from_node_into_array($texture_node, 'field_texres', $output, 'texres');
  model3d_integration_extract_value_from_node_into_array($texture_node, 'field_reflection_type', $output, 'reflectionType');

  cache_set('model3d_integration_node_' . $texture_node->nid, $output);

  return $output;
}

function model3d_integration_extract_color_from_node_into_array($node, $field_name, &$output, $key) {
  $val = field_get_items('node', $node, $field_name);
  if (!empty($val[0])) {
    libraries_load('Model3D');
    $val = $val[0]['rgb'];
    $output[$key] = $val; //\Model3D\Utils::toColorNumString($val);
  }
}

function model3d_integration_extract_value_from_node_into_array($node, $field_name, &$output, $key) {
  $val = field_get_items('node', $node, $field_name);
  if (!empty($val[0])) {
    $val = $val[0]['value'];
    $output[$key] = $val;
  }
}