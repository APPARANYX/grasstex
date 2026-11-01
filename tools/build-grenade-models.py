"""Author the opt-in grenade slice's imported props, in metres, with grip at origin.

Regenerate with /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup
--python tools/build-grenade-models.py. Original project-authored meshes; no external assets.
Blender +Z becomes glTF +Y. Both models keep a common hand grip origin.
"""
import math
from pathlib import Path

import bpy

OUT = Path(__file__).resolve().parents[1] / "Assets" / "weapons"


def material(name, color, metal=0.0, rough=0.7):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Metallic"].default_value = metal
    shader.inputs["Roughness"].default_value = rough
    return mat


def finish(obj, name, mat):
    obj.name = name
    obj.data.materials.append(mat)
    return obj


def cylinder(name, radius, depth, z, mat, top=None):
    bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=radius,
                                   radius2=radius if top is None else top,
                                   depth=depth, location=(0, 0, z))
    obj = finish(bpy.context.object, name, mat)
    bevel = obj.modifiers.new("Machined edge", "BEVEL")
    bevel.width, bevel.segments = 0.0008, 2
    obj.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
    return obj


def box(name, dims, at, mat):
    bpy.ops.mesh.primitive_cube_add(size=1, location=at)
    obj = finish(bpy.context.object, name, mat)
    obj.scale = dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bevel = obj.modifiers.new("Rounded casting", "BEVEL")
    bevel.width, bevel.segments = 0.0007, 2
    obj.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
    return obj


def mk2(olive, steel):
    # Raised segmented casting over a dark recessed body: 12 ribs x 6 bands.
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=1)
    body = finish(bpy.context.object, "Mk2 recessed cast body", olive)
    body.scale = (0.026, 0.026, 0.043)
    for row in range(6):
        z = -0.036 + row * 0.014
        radius = 0.030 * math.sqrt(max(0.25, 1 - (z / 0.052) ** 2))
        for col in range(12):
            angle = col * math.tau / 12
            rib = box("Mk2 raised cast segment", (0.013, 0.007, 0.012),
                      (math.sin(angle) * radius, math.cos(angle) * radius, z), olive)
            rib.rotation_euler.z = -angle
    cylinder("Mk2 fuse collar", 0.012, 0.016, 0.049, steel)
    box("Mk2 safety lever crown", (0.013, 0.042, 0.004), (0, 0.010, 0.059), steel)
    lever = box("Mk2 safety spoon", (0.012, 0.005, 0.075), (0, 0.033, 0.019), steel)
    lever.rotation_euler.x = -0.13
    bpy.ops.mesh.primitive_torus_add(major_segments=24, minor_segments=6,
                                    major_radius=0.011, minor_radius=0.0011,
                                    location=(0.020, -0.002, 0.054), rotation=(math.pi / 2, 0, 0))
    finish(bpy.context.object, "Mk2 pull ring", steel)


def stick(olive, steel, wood):
    cylinder("M24 turned wooden handle", 0.014, 0.230, 0.005, wood, 0.012)
    cylinder("M24 handle neck", 0.011, 0.030, 0.133, wood)
    cylinder("M24 steel explosive head", 0.031, 0.080, 0.185, olive)
    cylinder("M24 rolled top rim", 0.032, 0.004, 0.227, steel)
    cylinder("M24 rolled bottom rim", 0.032, 0.004, 0.143, steel)
    cylinder("M24 threaded handle collar", 0.017, 0.011, 0.133, steel)
    cylinder("M24 screw cap", 0.0155, 0.014, -0.117, steel)
    for z in (-0.112, -0.116, -0.120):
        cylinder("M24 cap knurl", 0.016, 0.0014, z, steel)


def export(name):
    OUT.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="SELECT")
    bpy.context.view_layer.objects.active = bpy.context.selected_objects[0]
    bpy.ops.object.convert(target="MESH")
    bpy.ops.object.join()
    bpy.context.object.name = name.removesuffix(".glb")
    bpy.ops.export_scene.gltf(filepath=str(OUT / name), export_format="GLB",
                              use_selection=True, export_apply=True,
                              export_materials="EXPORT", export_yup=True)
    bpy.ops.object.delete(use_global=False)


bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
olive = material("Painted olive cast iron", (0.19, 0.23, 0.10), 0.38, 0.76)
steel = material("Worn phosphate steel", (0.25, 0.27, 0.20), 0.65, 0.48)
wood = material("Aged beech handle", (0.40, 0.25, 0.11), 0, 0.83)
mk2(olive, steel)
export("us-mk2-grenade.glb")
stick(olive, steel, wood)
export("ge-m24-grenade.glb")
