function promisify<T>(f: (...args: unknown[]) => void, ...args: unknown[]) {
    return new Promise<T>((resolve, reject) => {
        args.push((r: T) => {
            resolve(r)
        })
        args.push((e: unknown) => {
            reject(e)
        })
        f(...args)
    })
}

/** it provides biometric password saving service */
export interface BioPass {
    /** type of biometric authentication */
    readonly authType: 'face' | 'touch'

    /** the name of the password */
    readonly name: string

    /** if the password previously saved */
    has(): Promise<boolean>

    /** save the password */
    save(password: string): Promise<void>

    /** delete the saved password */
    delete(): Promise<void>

    /** recall the saved password */
    recall(msg: string): Promise<string>
}

export namespace BioPass {
    export async function init(name: string): Promise<BioPass | null> {
        if (process.env.MODE === 'cordova') {
            const touchid = window.plugins.touchid

            let type = ''
            try {
                type = await promisify<string>(touchid.isAvailable.bind(touchid))
            } catch {
                return null
            }

            return {
                get authType() { return type === 'face' ? 'face' : 'touch' },
                get name() { return name },
                has: () => {
                    return promisify(touchid.has.bind(touchid), name)
                        .then(() => true)
                        .catch(() => false)
                },
                save: (password) => {
                    return promisify(touchid.save.bind(touchid), name, password, true)
                },
                delete: () => {
                    return promisify(touchid.delete.bind(touchid), name)
                },
                recall: (msg) => {
                    return promisify(touchid.verify.bind(touchid), name, msg)
                }
            }
        }
        return null
    }
}
