//
//  main.m
//  mTool-sudo
//
//  Created by Alex on 2017/1/18.
//  Copyright © 2017年 MyDreamPlus. All rights reserved.
//

#import <Foundation/Foundation.h>

int main(int argc, const char * argv[]) {
    
    @autoreleasepool {
        NSFileManager *fileManager = [NSFileManager defaultManager];
        BOOL isSsConfSysExists = [fileManager fileExistsAtPath:@"/Library/mTool/ss-conf-sys"];
        
        if (isSsConfSysExists) {
            NSLog(@"no need to re-install");
            return 0;
        }
        
        static AuthorizationRef authRef;
        static AuthorizationFlags authFlags;
        authFlags = kAuthorizationFlagDefaults
        | kAuthorizationFlagExtendRights
        | kAuthorizationFlagInteractionAllowed
        | kAuthorizationFlagPreAuthorize;
        OSStatus authErr = AuthorizationCreate(nil, kAuthorizationEmptyEnvironment, authFlags, &authRef);
        if (authErr != noErr) {
            authRef = nil;
        } else {
            if (authRef == NULL) {
                NSLog(@"No authorization has been granted to modify network configuration");
                return 1;
            }
            
            if (!isSsConfSysExists) {
                NSString *helperPath = [NSString stringWithFormat:@"%@/%@", [[NSBundle mainBundle] resourcePath], @"install_helper.sh"];
                NSLog(@"run install script: %@", helperPath);
                NSDictionary *error;
                NSString *script = [NSString stringWithFormat:@"do shell script \"bash %@\" with administrator privileges", helperPath];
                NSAppleScript *appleScript = [[NSAppleScript new] initWithSource:script];
                if ([appleScript executeAndReturnError:&error]) {
                    NSLog(@"installation success");
                } else {
                    NSLog(@"installation failure");
                }
            } else {
                NSLog(@"no need to re-install");
            }
        }
    }
    
    return 0;
}
