# Preserve Kotlin metadata for Ionic's filesystem lib and Capacitor plugins
# so R8/D8 doesn't corrupt coroutine state machines or reflection metadata.
-keep class io.ionic.libs.** { *; }
-keep class com.capacitorjs.plugins.filesystem.** { *; }
-keepattributes *Annotation*, Signature, EnclosingMethod, InnerClasses

# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile
