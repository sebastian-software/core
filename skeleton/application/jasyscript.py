#
# This is the jasyscript.py of $${name} file. 
# This file defines tasks for the Jasy build tool we use for development and deployment of $${name}.
#

profile = Profile(session)

# Configure Parts
profile.registerPart("kernel", className="$${name}.Kernel")
profile.registerPart("main", className="$${name}.Main", styleName="$${name}.Main")

# Configure Permutations
#profile.permutateField("device")
#profile.setField("runtime", "browser")
#profile.setLocales(["en", "de"])

@task
def clean():
    """Clear build cache"""
    
    core.clean()


@task
def distclean():
    """Clear caches and build results"""
    
    core.distclean()


@task
def api():
    """Build API viewer"""
    
    core.api()
    
    
@task
def server():
    """Start HTTP server"""
    
    session.pause()
    Server().start()
    session.resume()


@task
def source():
    """Generate source (development) version"""

    # Force debug enabled
    profile.setField("debug", True)

    # Load all scripts/assets from source folder
    profile.setUseSource(True)

    # Start actual build
    Build.run(profile)


@task
def build():
    """Generate deployable and combined build version"""

    # Enable both debugging and final
    profile.permutateField("debug")

    # Enable copying and hashing of assets
    profile.setHashAssets(True)
    profile.setCopyAssets(True)

    # Start actual build
    Build.run(profile)

