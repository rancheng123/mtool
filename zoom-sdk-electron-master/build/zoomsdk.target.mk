# This file is generated by gyp; do not edit.

TOOLSET := target
TARGET := zoomsdk
DEFS_Debug := \
	'-DNODE_GYP_MODULE_NAME=zoomsdk' \
	'-DUSING_UV_SHARED=1' \
	'-DUSING_V8_SHARED=1' \
	'-DV8_DEPRECATION_WARNINGS=1' \
	'-DV8_DEPRECATION_WARNINGS' \
	'-DV8_IMMINENT_DEPRECATION_WARNINGS' \
	'-D_DARWIN_USE_64_BIT_INODE=1' \
	'-D_LARGEFILE_SOURCE' \
	'-D_FILE_OFFSET_BITS=64' \
	'-DOPENSSL_THREADS' \
	'-DBUILDING_NODE_EXTENSION' \
	'-DDEBUG' \
	'-D_DEBUG' \
	'-DV8_ENABLE_CHECKS'

# Flags passed to all source files.
CFLAGS_Debug := \
	-O0 \
	-gdwarf-2 \
	-mmacosx-version-min=10.7 \
	-arch x86_64 \
	-Wall \
	-Wendif-labels \
	-W \
	-Wno-unused-parameter \
	-F./../sdk/mac/ZoomSDK

# Flags passed to only C files.
CFLAGS_C_Debug := \
	-fno-strict-aliasing

# Flags passed to only C++ files.
CFLAGS_CC_Debug := \
	-std=gnu++1y \
	-stdlib=libc++ \
	-fno-rtti \
	-fno-exceptions \
	-ObjC++ \
	-std=c++11 \
	-stdlib=libc++ \
	-fvisibility=hidden \
	-frtti

# Flags passed to only ObjC files.
CFLAGS_OBJC_Debug :=

# Flags passed to only ObjC++ files.
CFLAGS_OBJCC_Debug :=

INCS_Debug := \
	-I/Users/deo/Library/Caches/node-gyp/5.0.2/include/node \
	-I/Users/deo/Library/Caches/node-gyp/5.0.2/src \
	-I/Users/deo/Library/Caches/node-gyp/5.0.2/deps/openssl/config \
	-I/Users/deo/Library/Caches/node-gyp/5.0.2/deps/openssl/openssl/include \
	-I/Users/deo/Library/Caches/node-gyp/5.0.2/deps/uv/include \
	-I/Users/deo/Library/Caches/node-gyp/5.0.2/deps/zlib \
	-I/Users/deo/Library/Caches/node-gyp/5.0.2/deps/v8/include

DEFS_Release := \
	'-DNODE_GYP_MODULE_NAME=zoomsdk' \
	'-DUSING_UV_SHARED=1' \
	'-DUSING_V8_SHARED=1' \
	'-DV8_DEPRECATION_WARNINGS=1' \
	'-DV8_DEPRECATION_WARNINGS' \
	'-DV8_IMMINENT_DEPRECATION_WARNINGS' \
	'-D_DARWIN_USE_64_BIT_INODE=1' \
	'-D_LARGEFILE_SOURCE' \
	'-D_FILE_OFFSET_BITS=64' \
	'-DOPENSSL_THREADS' \
	'-DBUILDING_NODE_EXTENSION'

# Flags passed to all source files.
CFLAGS_Release := \
	-Os \
	-gdwarf-2 \
	-mmacosx-version-min=10.7 \
	-arch x86_64 \
	-Wall \
	-Wendif-labels \
	-W \
	-Wno-unused-parameter \
	-F./../sdk/mac/ZoomSDK

# Flags passed to only C files.
CFLAGS_C_Release := \
	-fno-strict-aliasing

# Flags passed to only C++ files.
CFLAGS_CC_Release := \
	-std=gnu++1y \
	-stdlib=libc++ \
	-fno-rtti \
	-fno-exceptions \
	-ObjC++ \
	-std=c++11 \
	-stdlib=libc++ \
	-fvisibility=hidden \
	-frtti

# Flags passed to only ObjC files.
CFLAGS_OBJC_Release :=

# Flags passed to only ObjC++ files.
CFLAGS_OBJCC_Release :=

INCS_Release := \
	-I/Users/deo/Library/Caches/node-gyp/5.0.2/include/node \
	-I/Users/deo/Library/Caches/node-gyp/5.0.2/src \
	-I/Users/deo/Library/Caches/node-gyp/5.0.2/deps/openssl/config \
	-I/Users/deo/Library/Caches/node-gyp/5.0.2/deps/openssl/openssl/include \
	-I/Users/deo/Library/Caches/node-gyp/5.0.2/deps/uv/include \
	-I/Users/deo/Library/Caches/node-gyp/5.0.2/deps/zlib \
	-I/Users/deo/Library/Caches/node-gyp/5.0.2/deps/v8/include

OBJS := \
	$(obj).target/$(TARGET)/lib/node_add_on/mac/zoom_native_sdk_wrap_core.o \
	$(obj).target/$(TARGET)/lib/node_add_on/mac/auth_service_wrap_core.o \
	$(obj).target/$(TARGET)/lib/node_add_on/zoom_node_addon.o \
	$(obj).target/$(TARGET)/lib/node_add_on/mac/sdk_native_error.o \
	$(obj).target/$(TARGET)/lib/node_add_on/mac/authServiceDelegate.o \
	$(obj).target/$(TARGET)/lib/node_add_on/mac/meeting_service_wrap_core.o \
	$(obj).target/$(TARGET)/lib/node_add_on/mac/meetingServiceDelegate.o \
	$(obj).target/$(TARGET)/lib/node_add_on/mac/meeting_ui_service.o \
	$(obj).target/$(TARGET)/lib/node_add_on/mac/meeting_as_service.o \
	$(obj).target/$(TARGET)/lib/node_add_on/mac/meeting_audio_service.o \
	$(obj).target/$(TARGET)/lib/node_add_on/mac/meeting_video_service.o \
	$(obj).target/$(TARGET)/lib/node_add_on/mac/meeting_participants_service.o \
	$(obj).target/$(TARGET)/lib/node_add_on/mac/zoom_setting_service.o \
	$(obj).target/$(TARGET)/lib/node_add_on/mac/setting_video_service.o \
	$(obj).target/$(TARGET)/lib/node_add_on/mac/setting_audio_service.o \
	$(obj).target/$(TARGET)/lib/node_add_on/mac/setting_general_service.o \
	$(obj).target/$(TARGET)/lib/node_add_on/mac/setting_recording_service.o \
	$(obj).target/$(TARGET)/lib/node_add_on/mac/customized_resource_wrap_core.o \
	$(obj).target/$(TARGET)/lib/node_add_on/mac/meeting_share_service.o \
	$(obj).target/$(TARGET)/lib/node_add_on/mac/meeting_H323_service.o \
	$(obj).target/$(TARGET)/lib/node_add_on/mac/meeting_config_service.o \
	$(obj).target/$(TARGET)/lib/node_add_on/mac/meeting_premeeting_service.o \
	$(obj).target/$(TARGET)/lib/node_add_on/mac/task_to_main.o \
	$(obj).target/$(TARGET)/lib/node_add_on/zoom_node_meeting_annotation.o \
	$(obj).target/$(TARGET)/lib/node_add_on/zoom_node_meeting_audio_ctrl.o \
	$(obj).target/$(TARGET)/lib/node_add_on/zoom_node_meeting_video_ctrl.o \
	$(obj).target/$(TARGET)/lib/node_add_on/zoom_node_meeting_participants_ctrl.o \
	$(obj).target/$(TARGET)/lib/node_add_on/zoom_node_meeting_share_ctrl.o \
	$(obj).target/$(TARGET)/lib/node_add_on/zoom_node_meeting_h323_ctrl.o \
	$(obj).target/$(TARGET)/lib/node_add_on/zoom_node_meeting_config_ctrl.o \
	$(obj).target/$(TARGET)/lib/node_add_on/zoom_node_setting_video_ctrl.o \
	$(obj).target/$(TARGET)/lib/node_add_on/zoom_node_setting_audio_ctrl.o \
	$(obj).target/$(TARGET)/lib/node_add_on/zoom_node_setting_general_ctrl.o \
	$(obj).target/$(TARGET)/lib/node_add_on/zoom_node_setting_recording_ctrl.o \
	$(obj).target/$(TARGET)/lib/node_add_on/zoom_node_customized_resource.o \
	$(obj).target/$(TARGET)/lib/node_add_on/zoom_node_direct_share_helper.o \
	$(obj).target/$(TARGET)/lib/node_add_on/zoom_node_video_raw_data.o \
	$(obj).target/$(TARGET)/lib/node_add_on/zoom_node_audio_raw_data.o \
	$(obj).target/$(TARGET)/lib/node_add_on/zoom_node_share_raw_data.o \
	$(obj).target/$(TARGET)/lib/node_add_on/zoom_v8_to_c.o \
	$(obj).target/$(TARGET)/lib/node_add_on/run_task_to_main_thread.o \
	$(obj).target/$(TARGET)/lib/node_add_on/zoom_node_raw_data_license.o \
	$(obj).target/$(TARGET)/lib/node_add_on/zoom_raw_data_wrap.o \
	$(obj).target/$(TARGET)/lib/node_add_on/zoom_node_setting_ui_strategy_ctrl.o \
	$(obj).target/$(TARGET)/lib/node_add_on/zoom_node_sdk_sms_helper.o \
	$(obj).target/$(TARGET)/lib/node_add_on/mac/zoom_sms_wrap.o \
	$(obj).target/$(TARGET)/lib/node_add_on/zoom_node_setting_statistic_ctrl.o \
	$(obj).target/$(TARGET)/lib/node_add_on/zoom_node_setting_accessibility_ctrl.o \
	$(obj).target/$(TARGET)/lib/node_add_on/mac/settingServiceDelegate.o \
	$(obj).target/$(TARGET)/lib/node_add_on/mac/setting_statistic_service.o \
	$(obj).target/$(TARGET)/lib/node_add_on/mac/setting_accessibility_service.o \
	$(obj).target/$(TARGET)/lib/node_add_on/raw_data_format.o \
	$(obj).target/$(TARGET)/lib/node_add_on/uv_ipc_common.o \
	$(obj).target/$(TARGET)/lib/node_add_on/raw_data_uv_ipc_server.o

# Add to the list of files we specially track dependencies for.
all_deps += $(OBJS)

# CFLAGS et al overrides must be target-local.
# See "Target-specific Variable Values" in the GNU Make manual.
$(OBJS): TOOLSET := $(TOOLSET)
$(OBJS): GYP_CFLAGS := $(DEFS_$(BUILDTYPE)) $(INCS_$(BUILDTYPE))  $(CFLAGS_$(BUILDTYPE)) $(CFLAGS_C_$(BUILDTYPE))
$(OBJS): GYP_CXXFLAGS := $(DEFS_$(BUILDTYPE)) $(INCS_$(BUILDTYPE))  $(CFLAGS_$(BUILDTYPE)) $(CFLAGS_CC_$(BUILDTYPE))
$(OBJS): GYP_OBJCFLAGS := $(DEFS_$(BUILDTYPE)) $(INCS_$(BUILDTYPE))  $(CFLAGS_$(BUILDTYPE)) $(CFLAGS_C_$(BUILDTYPE)) $(CFLAGS_OBJC_$(BUILDTYPE))
$(OBJS): GYP_OBJCXXFLAGS := $(DEFS_$(BUILDTYPE)) $(INCS_$(BUILDTYPE))  $(CFLAGS_$(BUILDTYPE)) $(CFLAGS_CC_$(BUILDTYPE)) $(CFLAGS_OBJCC_$(BUILDTYPE))

# Suffix rules, putting all outputs into $(obj).

$(obj).$(TOOLSET)/$(TARGET)/%.o: $(srcdir)/%.mm FORCE_DO_CMD
	@$(call do_cmd,objcxx,1)

$(obj).$(TOOLSET)/$(TARGET)/%.o: $(srcdir)/%.cpp FORCE_DO_CMD
	@$(call do_cmd,cxx,1)

# Try building from generated source, too.

$(obj).$(TOOLSET)/$(TARGET)/%.o: $(obj).$(TOOLSET)/%.mm FORCE_DO_CMD
	@$(call do_cmd,objcxx,1)

$(obj).$(TOOLSET)/$(TARGET)/%.o: $(obj).$(TOOLSET)/%.cpp FORCE_DO_CMD
	@$(call do_cmd,cxx,1)

$(obj).$(TOOLSET)/$(TARGET)/%.o: $(obj)/%.mm FORCE_DO_CMD
	@$(call do_cmd,objcxx,1)

$(obj).$(TOOLSET)/$(TARGET)/%.o: $(obj)/%.cpp FORCE_DO_CMD
	@$(call do_cmd,cxx,1)

# End of this set of suffix rules
### Rules for final target.
LDFLAGS_Debug := \
	-stdlib=libc++ \
	-undefined dynamic_lookup \
	-Wl,-no_pie \
	-Wl,-search_paths_first \
	-mmacosx-version-min=10.7 \
	-arch x86_64 \
	-L$(builddir) \
	-F./../sdk/mac/ZoomSDK \
	-stdlib=libc++

LIBTOOLFLAGS_Debug := \
	-stdlib=libc++ \
	-undefined dynamic_lookup \
	-Wl,-no_pie \
	-Wl,-search_paths_first

LDFLAGS_Release := \
	-stdlib=libc++ \
	-undefined dynamic_lookup \
	-Wl,-no_pie \
	-Wl,-search_paths_first \
	-mmacosx-version-min=10.7 \
	-arch x86_64 \
	-L$(builddir) \
	-F./../sdk/mac/ZoomSDK \
	-stdlib=libc++

LIBTOOLFLAGS_Release := \
	-stdlib=libc++ \
	-undefined dynamic_lookup \
	-Wl,-no_pie \
	-Wl,-search_paths_first

LIBS := \
	-framework ZoomSDK

$(builddir)/zoomsdk.node: GYP_LDFLAGS := $(LDFLAGS_$(BUILDTYPE))
$(builddir)/zoomsdk.node: LIBS := $(LIBS)
$(builddir)/zoomsdk.node: GYP_LIBTOOLFLAGS := $(LIBTOOLFLAGS_$(BUILDTYPE))
$(builddir)/zoomsdk.node: export BUILT_FRAMEWORKS_DIR := ${abs_builddir}
$(builddir)/zoomsdk.node: export BUILT_PRODUCTS_DIR := ${abs_builddir}
$(builddir)/zoomsdk.node: export CHROMIUM_STRIP_SAVE_FILE := 
$(builddir)/zoomsdk.node: export CONFIGURATION := ${BUILDTYPE}
$(builddir)/zoomsdk.node: export DYLIB_INSTALL_NAME_BASE := @rpath
$(builddir)/zoomsdk.node: export EXECUTABLE_NAME := zoomsdk.node
$(builddir)/zoomsdk.node: export EXECUTABLE_PATH := zoomsdk.node
$(builddir)/zoomsdk.node: export FULL_PRODUCT_NAME := zoomsdk.node
$(builddir)/zoomsdk.node: export LD_DYLIB_INSTALL_NAME := @rpath/zoomsdk.node
$(builddir)/zoomsdk.node: export MACH_O_TYPE := mh_bundle
$(builddir)/zoomsdk.node: export PRODUCT_NAME := zoomsdk
$(builddir)/zoomsdk.node: export PRODUCT_TYPE := com.apple.product-type.library.dynamic
$(builddir)/zoomsdk.node: export SDKROOT := 
$(builddir)/zoomsdk.node: export SRCROOT := ${abs_srcdir}/
$(builddir)/zoomsdk.node: export SOURCE_ROOT := ${SRCROOT}
$(builddir)/zoomsdk.node: export TARGET_BUILD_DIR := ${abs_builddir}
$(builddir)/zoomsdk.node: export TEMP_DIR := ${TMPDIR}
$(builddir)/zoomsdk.node: TARGET_POSTBUILDS_Debug := "echo DSYMUTIL\\(zoomsdk\\)" "dsymutil $(builddir)/zoomsdk.node -o $(builddir)/zoomsdk.node.dSYM"
$(builddir)/zoomsdk.node: TARGET_POSTBUILDS_Release := "echo DSYMUTIL\\(zoomsdk\\)" "dsymutil $(builddir)/zoomsdk.node -o $(builddir)/zoomsdk.node.dSYM"
$(builddir)/zoomsdk.node: builddir := $(abs_builddir)
$(builddir)/zoomsdk.node: POSTBUILDS := 'cd ""' $(TARGET_POSTBUILDS_$(BUILDTYPE))
$(builddir)/zoomsdk.node: TOOLSET := $(TOOLSET)
$(builddir)/zoomsdk.node: $(OBJS) FORCE_DO_CMD
	$(call do_cmd,solink_module,,1)

all_deps += $(builddir)/zoomsdk.node
# Add target alias
.PHONY: zoomsdk
zoomsdk: $(builddir)/zoomsdk.node

# Short alias for building this executable.
.PHONY: zoomsdk.node
zoomsdk.node: $(builddir)/zoomsdk.node

# Add executable to "all" target.
.PHONY: all
all: $(builddir)/zoomsdk.node

