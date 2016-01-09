/**
 * Created by neeravbm on 12/27/15.
 */
var renderer = null,
    scene = null,
    camera = null;

function animate() {
    requestAnimationFrame(function () {
        animate();
    });

    controls.update();

    // Render the scene
    renderer.render(scene, camera);
}

(function ($, THREE) {
    Drupal.behaviors.model3d_integration_render_object = {
        attach: function (context, settings) {
            var object = settings.model3d_integration.object;
            var vertices = [], normals = [], uvs = [], materials = [];
            $.each(object.vertex_data, function (index, element) {
                var words = element.split(' ').filter(function(n) { return n != ''; });
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
                            /*textureLoader = new THREE.TextureLoader();
                             textureLoader.load(mat.map_Kd.map_path, function(tex) {
                             material.map = tex;
                             });*/
                            material.map = new THREE.ImageUtils.loadTexture(mat.map_Ka.map_path);
                        }
                        if (mat.map_Kd) {
                            /*textureLoader = new THREE.TextureLoader();
                            textureLoader.load(mat.map_Kd.map_path, function(tex) {
                                material.map = tex;
                            });*/
                            material.map = new THREE.ImageUtils.loadTexture(mat.map_Kd.map_path);
                        }
                        if (mat.map_Ks) {
                            material.specularMap = new THREE.ImageUtils.loadTexture(mat.map_Ks.map_path);
                        }
                        if (mat.bump) {
                            /*textureLoader = new THREE.TextureLoader();
                            textureLoader.load(mat.bump.map_path, function(tex) {
                                material.bumpMap = tex;
                            });*/
                            material.bumpMap = new THREE.ImageUtils.loadTexture(mat.bump.map_path);
                        }
                        materials.push(new THREE.MeshPhongMaterial(material));
                    }

                    $.each(element_m.face_data, function (index, element) {
                        var words = element.split(' ').filter(function(n) { return n != ''; });
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
                                    normal = [face_normal[0], face_normal[offset], face_normal[offset+1]];
                                }
                                geometry.faces.push(new THREE.Face3(face_vertex[0], face_vertex[offset], face_vertex[offset+1], normal, color, mat_index));
                                if (face_texture.length >= offset + 1) {
                                    geometry.faceVertexUvs[0].push([face_texture[0], face_texture[offset], face_texture[offset+1]]);
                                }
                                else {
                                    geometry.faceVertexUvs[0].push([0, 0, 0]);
                                }
                            }
                            //geometry.faces.push(new THREE.Face3(face_vertex[0], face_vertex[1], face_vertex[2], normal, color, mat_index));
                            //geometry.faces.push(new THREE.Face3(face_vertex[0], face_vertex[1], face_vertex[2], normal, color));
                            /*if (face_texture.length >= 3) {
                                geometry.faceVertexUvs[0].push([face_texture[0], face_texture[1], face_texture[2]]);
                            }*/
                            //geometry.faceVertexUvs[geometry.faces.length - 1].push(uv);

                            /*if (words.length == 3) {
                                // Face represents a triangle. Do nothing.
                            }
                            else if (words.length == 4) {
                                // Face represents a quad, which has been removed in THREE.js.
                                // Represent by two triangles.
                                normal = [face_normal[0], face_normal[2], face_normal[3]];
                                //geometry.faces.push(new THREE.Face3(face_vertex[0], face_vertex[2], face_vertex[3], normal, color));
                                geometry.faces.push(new THREE.Face3(face_vertex[0], face_vertex[2], face_vertex[3], normal, color, mat_index));
                                //geometry.faceVertexUvs[geometry.faces.length - 1].push(uv);
                                if (face_texture.length >= 4) {
                                    geometry.faceVertexUvs[0].push([face_texture[0], face_texture[2], face_texture[3]]);
                                }
                            }*/
                        }
                    });
                });
            });

            var width = window.innerWidth;
            var height = window.innerHeight;

            renderer = new THREE.WebGLRenderer({antialias: true});
            renderer.setSize(width, height);
            /*renderer.shadowMapEnabled = true;
            renderer.shadowMapSoft = true;*/
            document.body.appendChild(renderer.domElement);

            scene = new THREE.Scene;

            var light = new THREE.AmbientLight(0xFFFFFF);
            scene.add(light);

            light = new THREE.SpotLight(0xffffff);
            light.position.set(0, 5, 0);
            /*light.castShadow = true;
            light.shadowMapWidth = 1024;
            light.shadowMapHeight = 1024;
            light.shadowCameraNear = 500;
            light.shadowCameraFar = 4000;
            light.shadowCameraFov = 30;*/
            scene.add(light);

            faceMaterial = undefined;
            if (materials.length) {
                var faceMaterial = new THREE.MeshFaceMaterial(materials);
            }

            var mesh = new THREE.Mesh(geometry, faceMaterial);
            //mesh.scale.set(1, 1, 1);
            /*mesh.castShadow = true;
            mesh.receiveShadow = true;*/
            //mesh.scale.set(0.0004, 0.0004, 0.0004);

            // Look at operations.
            $.each(object.operations, function (index_o, element_o) {
                var amount;
                if (element_o.type == 'rotate') {
                    var axis = element_o.axis.split(' ').filter(function(n) { return n != ''; });
                    axis = new THREE.Vector3(axis[0], axis[1], axis[2]);
                    angle = element_o.angle * Math.PI / 180;
                    mesh.rotateOnAxis(axis, angle);
                }
                else if (element_o.type == 'translate') {
                    amount = element_o.amount.split(' ').filter(function(n) { return n != ''; });
                    mesh.translateX(amount[0]);
                    mesh.translateY(amount[1]);
                    mesh.translateZ(amount[2]);
                }
                else if (element_o.type == 'scale') {
                    amount = element_o.amount.split(' ').filter(function(n) { return n != ''; });
                    mesh.scale.set(amount[0], amount[1], amount[2]);
                }
            });
            scene.add(mesh);

            var helper = new THREE.BoundingBoxHelper(mesh, 0xff0000);
            helper.update();
            //scene.add(helper);
            console.log(helper.box.min);
            console.log(helper.box.max);

            geometry = new THREE.PlaneGeometry(3, 3);
            var material = new THREE.MeshPhongMaterial({color: 0xffffff, side: THREE.DoubleSide});
            var plane = new THREE.Mesh(geometry, material);
            plane.rotation.x = Math.PI/2;
            plane.position.y = -0.01;
            //plane.receiveShadow = true;
            scene.add(plane);

            camera = new THREE.PerspectiveCamera(45, width/height, 0.1, 100);
            camera.position.set(0, 1, -2);
            camera.up = new THREE.Vector3(0, 1, 0);
            camera.lookAt(new THREE.Vector3(0, 0, 0));
            //scene.add(camera);

            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.25;
            controls.enableZoom = true;

            controls.minDistance = 0.5;
            controls.maxDistance = 5;

            controls.minPolarAngle = 0;

            // Don't let go below the ground.
            controls.maxPolarAngle = 2 * Math.PI/5;

            renderer.render(scene, camera);

            animate();
        }
    };
})(jQuery, THREE);