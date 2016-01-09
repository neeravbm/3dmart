/**
 * Created by neeravbm on 12/27/15.
 */

/*function animate() {
 requestAnimationFrame(function () {
 animate();
 });

 controls.update();

 // Render the scene
 renderer.render(scene, camera);
 }*/

function loadObject(object, $) {
    var vertices = [], normals = [], uvs = [], materials = [];
    $.each(object.vertex_data, function (index, element) {
        var words = element.split(' ').filter(function (n) {
            return n != '';
        });
        if (words[0] == 'v') {
            vertices.push(new THREE.Vector3(parseFloat(words[1]), parseFloat(words[2]), parseFloat(words[3])));
        }
        else if (words[0] == 'vn') {
            normals.push(new THREE.Vector3(parseFloat(words[1]), parseFloat(words[2]), parseFloat(words[3])));
        }
        else if (words[0] == 'vt') {
            uvs.push(new THREE.Vector3(parseFloat(words[1]), parseFloat(words[2]), (words[3] ? parseFloat(words[3]) : 0)));
        }
    });

    var geometry = new THREE.Geometry();
    geometry.vertices = vertices;

    $.each(object.groups, function (index_g, element_g) {
        var vertex_count = parseInt(element_g.vertex_count);
        var normal_count = parseInt(element_g.normal_count);
        var texture_count = parseInt(element_g.texture_count);
        var textureLoader;
        $.each(element_g.meshes, function (index_m, element_m) {
            // Get the material.
            var mat = element_m.material;
            var material = {};
            if (mat != undefined) {
                if (mat.Kd) {
                    material.color = mat.Kd;
                }
                if (mat.Ks) {
                    material.specular = mat.Ks;
                }
                if (mat.d && mat.d < 1) {
                    material.opacity = mat.d;
                    material.transparent = true;
                }
                if (mat.Ns) {
                    material.shininess = mat.Ns;
                }
                if (mat.map_Ka) {
                    textureLoader = new THREE.TextureLoader();
                    material.map = textureLoader.load(mat.map_Ka.map_path, render);
                }
                if (mat.map_Kd) {
                    textureLoader = new THREE.TextureLoader();
                    material.map = textureLoader.load(mat.map_Kd.map_path, render);
                }
                if (mat.map_Ks) {
                    textureLoader = new THREE.TextureLoader();
                    material.specularMap = textureLoader.load(mat.map_Ks.map_path, render);
                }
                if (mat.bump) {
                    textureLoader = new THREE.TextureLoader();
                    material.bumpMap = textureLoader.load(mat.bump.map_path, render);
                }
                materials.push(new THREE.MeshPhongMaterial(material));
            }

            $.each(element_m.face_data, function (index, element) {
                var words = element.split(' ').filter(function (n) {
                    return n != '';
                });
                if (words[0] == 's') {
                    // Don't know what to do as of now.
                }
                else if (words[0] == 'f') {
                    // Remove the first element "f".
                    words.shift();
                    var face_vertex = [];
                    var face_texture = [];
                    var face_normal = [];
                    var color;
                    $.each(words, function (index_w, element_w) {
                        var parts = element_w.split('/');
                        // Three.js index seems to start from 0.
                        var v = parseInt(parts[0]) - 1;
                        if (v < 0) {
                            v += vertex_count + 1;
                        }
                        face_vertex.push(v);
                        if (parts.length >= 2 && parts[1] != '') {
                            var t = parseInt(parts[1]) - 1;
                            if (t < 0) {
                                t += texture_count + 1;
                            }
                            face_texture.push(uvs[t]);
                        }
                        if (parts.length >= 3 && parts[2] != '') {
                            var n = parseInt(parts[2]) - 1;
                            if (n < 0) {
                                n += normal_count + 1;
                            }
                            face_normal.push(normals[n]);
                        }
                    });

                    //var normal = [face_normal[0], face_normal[1], face_normal[2]];

                    color = new THREE.Color(0xFFFFFF);
                    var mat_index = undefined;
                    if (!$.isEmptyObject(material)) {
                        mat_index = materials.length - 1;
                    }

                    for (var offset = 1; offset <= face_vertex.length - 2; offset++) {
                        var normal = undefined;
                        if (face_normal.length >= offset + 1) {
                            normal = [face_normal[0], face_normal[offset], face_normal[offset + 1]];
                        }
                        geometry.faces.push(new THREE.Face3(face_vertex[0], face_vertex[offset], face_vertex[offset + 1], normal, color, mat_index));
                        if (face_texture.length >= offset + 1) {
                            geometry.faceVertexUvs[0].push([face_texture[0], face_texture[offset], face_texture[offset + 1]]);
                        }
                        else {
                            geometry.faceVertexUvs[0].push([0, 0, 0]);
                        }
                    }
                }
            });
        });
    });

    faceMaterial = undefined;
    if (materials.length) {
        var faceMaterial = new THREE.MeshFaceMaterial(materials);
    }

    var mesh = new THREE.Mesh(geometry, faceMaterial);

    return mesh;
}


function operate(mesh, operations, $) {
    $.each(operations, function (index_o, element_o) {
        var amount;
        if (element_o.type == 'rotate') {
            var axis = element_o.axis.split(' ').filter(function (n) {
                return n != '';
            });
            axis = new THREE.Vector3(axis[0], axis[1], axis[2]);
            angle = element_o.angle * Math.PI / 180;
            mesh.rotateOnAxis(axis, angle);
        }
        else if (element_o.type == 'translate') {
            amount = element_o.amount.split(' ').filter(function (n) {
                return n != '';
            });
            mesh.translateX(amount[0]);
            mesh.translateY(amount[1]);
            mesh.translateZ(amount[2]);
        }
        else if (element_o.type == 'scale') {
            amount = element_o.amount.split(' ').filter(function (n) {
                return n != '';
            });
            mesh.scale.x *= amount[0];
            mesh.scale.y *= amount[1];
            mesh.scale.z *= amount[2];
        }
    });

    return mesh;
}

function onDocumentMouseDown(event) {
    var target = jQuery('#render-target');
    var meshes = event.data;
    var targetOffsetY = target[0].getBoundingClientRect().top;
    var targetOffsetX = target[0].getBoundingClientRect().left;
    var targetWidth = target.innerWidth();
    var targetHeight = target.innerHeight();
    var mouseX = (event.clientX - targetOffsetX) / targetWidth * 2 - 1;
    var mouseY = -(event.clientY - targetOffsetY) / targetHeight * 2 + 1;

    console.log(mouseX);
    console.log(mouseY);
    //var vector = new THREE.Vector3(( event.clientX / window.innerWidth ) * 2 - 1, -( event.clientY / window.innerHeight ) * 2 + 1, 1);
    var vector = new THREE.Vector3(mouseX, mouseY, 0.1);
    vector = vector.unproject(camera);
    var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
    var intersects = raycaster.intersectObjects(meshes, true);
    if (intersects.length > 0) {
        console.log(intersects[0]);
        if (!intersects[0].object.selected) {
            // Object is not selected.
            if (intersects[0].object.controls) {
                intersects[0].object.controls.visible = true;
            }
            jQuery.each(intersects[0].object.material.materials, function (index, element) {
                element.pre_selected_transparent = element.transparent;
                element.transparent = true;

                element.pre_selected_opacity = element.opacity;
                element.opacity = 0.8;

                element.pre_selected_emissive = element.emissive.clone();
                element.emissive = new THREE.Color(0x00ff00);
            });

            intersects[0].object.selected = true;
        }
        else {
            // Object is already selected. Iterate through translate, rotate and invisible states.
            if (intersects[0].object.controls) {
                var mode = intersects[0].object.controls.getMode();
                if (mode == 'translate') {
                    intersects[0].object.controls.setMode('rotate');
                }
                else if (mode == 'rotate') {
                    intersects[0].object.controls.visible = false;
                    intersects[0].object.controls.setMode('translate');

                    jQuery.each(intersects[0].object.material.materials, function (index, element) {
                        element.transparent = element.pre_selected_transparent;
                        delete element.pre_selected_transparent;

                        element.opacity = element.pre_selected_opacity;
                        delete element.pre_selected_opacity;

                        element.emissive = element.pre_selected_emissive.clone();
                        delete element.pre_selected_emissive;
                    });

                    delete intersects[0].object.selected;
                }
            }
        }
    }
    else {
        jQuery.each(meshes, function (index, element) {
            if (element.selected) {
                jQuery.each(element.material.materials, function (index_m, element_m) {
                    element_m.transparent = element_m.pre_selected_transparent;
                    delete element_m.pre_selected_transparent;

                    element_m.opacity = element_m.pre_selected_opacity;
                    delete element_m.pre_selected_opacity;

                    element_m.emissive = element_m.pre_selected_emissive.clone();
                    delete element_m.pre_selected_emissive;
                });

                delete element.selected;
                if (element.controls) {
                    element.controls.visible = false;
                }
            }
        });
    }

    render();
}

function addFloodLights(pos, scene, THREE) {
    var d = 0.15;

    light = new THREE.SpotLight(0x1c1c1c);
    light.position.set(pos.x, pos.y, pos.z);
    light.castShadow = true;
    light.shadowDarkness = 0.4;
    //light.shadowCameraVisible = true;
    light.shadowMapWidth = 1024;
    light.shadowMapHeight = 1024;
    light.shadowCameraNear = 2;
    light.shadowCameraFar = 5;
    light.shadowCameraFov = 80;
    scene.add(light);

    light = new THREE.SpotLight(0x1c1c1c);
    light.position.set(pos.x + d, pos.y, pos.z);
    light.castShadow = true;
    light.shadowDarkness = 0.4;
    //light.shadowCameraVisible = true;
    light.shadowMapWidth = 1024;
    light.shadowMapHeight = 1024;
    light.shadowCameraNear = 2;
    light.shadowCameraFar = 5;
    light.shadowCameraFov = 80;
    scene.add(light);

    light = new THREE.SpotLight(0x1c1c1c);
    light.position.set(pos.x - d, pos.y, pos.z);
    light.castShadow = true;
    light.shadowDarkness = 0.4;
    //light.shadowCameraVisible = true;
    light.shadowMapWidth = 1024;
    light.shadowMapHeight = 1024;
    light.shadowCameraNear = 2;
    light.shadowCameraFar = 5;
    light.shadowCameraFov = 80;
    scene.add(light);

    light = new THREE.SpotLight(0x1c1c1c);
    light.position.set(pos.x, pos.y, pos.z + d);
    light.castShadow = true;
    light.shadowDarkness = 0.4;
    //light.shadowCameraVisible = true;
    light.shadowMapWidth = 1024;
    light.shadowMapHeight = 1024;
    light.shadowCameraNear = 2;
    light.shadowCameraFar = 5;
    light.shadowCameraFov = 80;
    scene.add(light);

    light = new THREE.SpotLight(0x1c1c1c);
    light.position.set(pos.x, pos.y, pos.z - d);
    light.castShadow = true;
    light.shadowDarkness = 0.4;
    //light.shadowCameraVisible = true;
    light.shadowMapWidth = 1024;
    light.shadowMapHeight = 1024;
    light.shadowCameraNear = 2;
    light.shadowCameraFar = 5;
    light.shadowCameraFov = 80;
    scene.add(light);

    light = new THREE.SpotLight(0x1c1c1c);
    light.position.set(pos.x + 0.7 * d, pos.y, pos.z + 0.7 * d);
    light.castShadow = true;
    light.shadowDarkness = 0.4;
    //light.shadowCameraVisible = true;
    light.shadowMapWidth = 1024;
    light.shadowMapHeight = 1024;
    light.shadowCameraNear = 2;
    light.shadowCameraFar = 5;
    light.shadowCameraFov = 80;
    scene.add(light);

    light = new THREE.SpotLight(0x1c1c1c);
    light.position.set(pos.x + 0.7 * d, pos.y, pos.z - 0.7 * d);
    light.castShadow = true;
    light.shadowDarkness = 0.4;
    //light.shadowCameraVisible = true;
    light.shadowMapWidth = 1024;
    light.shadowMapHeight = 1024;
    light.shadowCameraNear = 2;
    light.shadowCameraFar = 5;
    light.shadowCameraFov = 80;
    scene.add(light);

    light = new THREE.SpotLight(0x1c1c1c);
    light.position.set(pos.x - 0.7 * d, pos.y, pos.z + 0.7 * d);
    light.castShadow = true;
    light.shadowDarkness = 0.4;
    //light.shadowCameraVisible = true;
    light.shadowMapWidth = 1024;
    light.shadowMapHeight = 1024;
    light.shadowCameraNear = 2;
    light.shadowCameraFar = 5;
    light.shadowCameraFov = 80;
    scene.add(light);

    light = new THREE.SpotLight(0x1c1c1c);
    light.position.set(pos.x - 0.7 * d, pos.y, pos.z - 0.7 * d);
    light.castShadow = true;
    light.shadowDarkness = 0.4;
    //light.shadowCameraVisible = true;
    light.shadowMapWidth = 1024;
    light.shadowMapHeight = 1024;
    light.shadowCameraNear = 2;
    light.shadowCameraFar = 5;
    light.shadowCameraFov = 80;
    scene.add(light);
}