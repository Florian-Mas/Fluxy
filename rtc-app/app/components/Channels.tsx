"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"
import { CheckIcon, ChevronRightIcon } from "lucide-react"


  function DropdownMenu({
    ...props
  }: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
    return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
  }

  function DropdownMenuPortal({
    ...props
  }: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
    return (
      <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
    )
  }

  function DropdownMenuTrigger({
    ...props
  }: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
    return (
      <DropdownMenuPrimitive.Trigger
        data-slot="dropdown-menu-trigger"
        {...props}
      />
    )
  }

  function DropdownMenuContent({
    className,
    align = "start",
    sideOffset = 4,
    ...props
  }: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
    return (
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          data-slot="dropdown-menu-content"
          sideOffset={sideOffset}
          align={align}
          className={cn("data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 bg-popover text-popover-foreground min-w-32 rounded-lg p-1 shadow-md ring-1 duration-100 z-50 max-h-(--radix-dropdown-menu-content-available-height) w-(--radix-dropdown-menu-trigger-width) origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto data-[state=closed]:overflow-hidden", className )}
          {...props}
        />
      </DropdownMenuPrimitive.Portal>
    )
  }

  function DropdownMenuGroup({
    ...props
  }: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
    return (
      <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
    )
  }

  function DropdownMenuItem({
    className,
    inset,
    variant = "default",
    ...props
  }: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
    variant?: "default" | "destructive"
  }) {
    return (
      <DropdownMenuPrimitive.Item
        data-slot="dropdown-menu-item"
        data-inset={inset}
        data-variant={variant}
        className={cn(
          "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:text-destructive not-data-[variant=destructive]:focus:**:text-accent-foreground gap-1.5 rounded-md px-1.5 py-1 text-sm [&_svg:not([class*='size-'])]:size-4 group/dropdown-menu-item relative flex cursor-default items-center outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0",
          className
        )}
        {...props}
      />
    )
  }

  function DropdownMenuCheckboxItem({
    className,
    children,
    checked,
    ...props
  }: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
    return (
      <DropdownMenuPrimitive.CheckboxItem
        data-slot="dropdown-menu-checkbox-item"
        className={cn(
          "focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm [&_svg:not([class*='size-'])]:size-4 relative flex cursor-default items-center outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
          className
        )}
        checked={checked}
        {...props}
      >
        <span
          className="pointer-events-none absolute right-2 flex items-center justify-center"
          data-slot="dropdown-menu-checkbox-item-indicator"
        >
          <DropdownMenuPrimitive.ItemIndicator>
            <CheckIcon
            />
          </DropdownMenuPrimitive.ItemIndicator>
        </span>
        {children}
      </DropdownMenuPrimitive.CheckboxItem>
    )
  }

  function DropdownMenuRadioGroup({
    ...props
  }: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
    return (
      <DropdownMenuPrimitive.RadioGroup
        data-slot="dropdown-menu-radio-group"
        {...props}
      />
    )
  }

  function DropdownMenuRadioItem({
    className,
    children,
    ...props
  }: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
    return (
      <DropdownMenuPrimitive.RadioItem
        data-slot="dropdown-menu-radio-item"
        className={cn(
          "focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm [&_svg:not([class*='size-'])]:size-4 relative flex cursor-default items-center outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
          className
        )}
        {...props}
      >
        <span
          className="absolute right-2 flex items-center justify-center pointer-events-none"
          data-slot="dropdown-menu-radio-item-indicator"
        >
          <DropdownMenuPrimitive.ItemIndicator>
            <CheckIcon
            />
          </DropdownMenuPrimitive.ItemIndicator>
        </span>
        {children}
      </DropdownMenuPrimitive.RadioItem>
    )
  }

  function DropdownMenuLabel({
    className,
    inset,
    ...props
  }: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }) {
    return (
      <DropdownMenuPrimitive.Label
        data-slot="dropdown-menu-label"
        data-inset={inset}
        className={cn("text-muted-foreground px-1.5 py-1 text-xs font-medium data-[inset]:pl-8", className)}
        {...props}
      />
    )
  }

  function DropdownMenuSeparator({
    className,
    ...props
  }: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
    return (
      <DropdownMenuPrimitive.Separator
        data-slot="dropdown-menu-separator"
        className={cn("bg-border -mx-1 my-1 h-px", className)}
        {...props}
      />
    )
  }

  function DropdownMenuShortcut({
    className,
    ...props
  }: React.ComponentProps<"span">) {
    return (
      <span
        data-slot="dropdown-menu-shortcut"
        className={cn("text-muted-foreground group-focus/dropdown-menu-item:text-accent-foreground ml-auto text-xs tracking-widest", className)}
        {...props}
      />
    )
  }

  function DropdownMenuSub({
    ...props
  }: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
    return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />
  }

  function DropdownMenuSubTrigger({
    className,
    inset,
    children,
    ...props
  }: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }) {
    return (
      <DropdownMenuPrimitive.SubTrigger
        data-slot="dropdown-menu-sub-trigger"
        data-inset={inset}
        className={cn(
          "focus:bg-accent focus:text-accent-foreground data-open:bg-accent data-open:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground gap-1.5 rounded-md px-1.5 py-1 text-sm [&_svg:not([class*='size-'])]:size-4 flex cursor-default items-center outline-hidden select-none data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0",
          className
        )}
        {...props}
      >
        {children}
        <ChevronRightIcon className="ml-auto" />
      </DropdownMenuPrimitive.SubTrigger>
    )
  }

  function DropdownMenuSubContent({
    className,
    ...props
  }: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
    return (
      <DropdownMenuPrimitive.SubContent
        data-slot="dropdown-menu-sub-content"
        className={cn("data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 bg-popover text-popover-foreground min-w-[96px] rounded-md p-1 shadow-lg ring-1 duration-100 z-50 origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden", className )}
        {...props}
      />
    )
  }

  export default function Channels() {
    const [servers, setServers] = React.useState<Array<{ id: number; name: string; image: string }>>([]);
    const [selectedServerId, setSelectedServerId] = React.useState<number | null>(null);
    const [loading, setLoading] = React.useState(true);
    const router = useRouter();

    const copyServerId = async (serverId: number) => {
      const link = `http://localhost:3001/join-serveur?id=${serverId}`;
      try {
        await navigator.clipboard.writeText(link);
        alert(`Lien du serveur copié : ${link}`);
      } catch (err) {
        console.error("Erreur lors de la copie:", err);
        const textArea = document.createElement("textarea");
        textArea.value = link;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        alert(`Lien du serveur copié : ${link}`);
      }
    };

    React.useEffect(() => {
        const fetchServers = async () => {
            try {
                const res = await fetch("/api/user-servers", {
                    credentials: "include",
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.servers && Array.isArray(data.servers)) {
                        const formattedServers = data.servers.map((server: any) => ({
                            id: server.id || 0,
                            name: server.name || "Serveur sans nom",
                            image: server.image || "/logo_fluxy.png",
                        }));
                        setServers(formattedServers);
                    }
                } else {
                    console.error("Erreur lors de la récupération des serveurs");
                }
            } catch (err) {
                console.error("Erreur réseau lors de la récupération des serveurs:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchServers();
    }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <div className="text-white">Chargement des serveurs...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      <nav className="h-16 bg-zinc-900  flex items-center justify-between px-4 shadow-lg shadow-orange-600/50 r border-orange-500 transition-all duration-300 ease-out hover:shadow-2xl hover:shadow-orange-600/70 ">
                
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="px-4 py-2 bg-zinc-900 rounded-lg border-2 border-orange-500 hover:bg-orange-700">
                <img 
                    src= "logo_fluxy.png"
                    alt= "stitch"
                    className="w-10 h-10 object-cover"
                    
                  />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-zinc-800 text-white border-zinc-700">
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="text-orange-600"
                  onSelect={() => router.push("/home")}
                >
                  Home
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-700" />
                <DropdownMenuItem
                  className="hover:bg-zinc-700"
                  onSelect={() => router.push("/create-serveur")}
                >
                  Créer un serveur 
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="hover:bg-zinc-700"
                  onSelect={() => router.push("/channels")}
                >
                  Rejoindre un serveur 
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="hover:bg-zinc-700"
                  onSelect={() => router.push("/profil")}
                >
                  Profil
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="hover:bg-zinc-700"
                  onSelect={() => router.push("/profil")}
                >
                  Paramètres 
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-zinc-700" />
              <DropdownMenuItem
                className="hover:bg-zinc-700 text-red-500"
                onSelect={async (e) => {
                  e.preventDefault();
                  try {
                    const res = await fetch("/api/logout", {
                      method: "POST",
                      credentials: "include",
                    });
                    const data = await res.json();
                    router.push("/");
                  } catch (err) {
                    router.push("/");
                  }
                }}
              >
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      




        
        <div className="flex-1 flex items-center justify-center gap-3">
          {servers.map((server) => (
            <DropdownMenu key={server.id}>
              <DropdownMenuTrigger asChild>
                <button className={`relative w-12 h-12 rounded-full overflow-hidden ring-2 ${
                  selectedServerId === server.id 
                    ? 'ring-orange-600 shadow-lg shadow-orange-600/60  ' 
                    : 'ring-transparent hover:ring-orange-500 '
                    
                }`}

              >
                  <img 
                    src={server.image} 
                    alt={server.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `https://via.placeholder.com/48/${Math.random().toString(16).substr(2, 6)}/ffffff?text=${server.name.charAt(0)}`;
                    }}
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-zinc-800 text-white border-zinc-700">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-orange-600 flex items-center justify-between">
                    <span
                      className="flex items-center gap-2 cursor-pointer flex-1"
                      onClick={() => router.push(`/channels?server_id=${server.id}`)}
                    >
                      <span>{server.name}</span>
                      <span className="text-zinc-400 text-sm">👁️</span>
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyServerId(server.id);
                      }}
                      className="ml-2 p-1 hover:bg-zinc-700 rounded transition-colors"
                      title="Copier l'ID du serveur"
                    >
                      <svg
                        className="w-4 h-4 text-zinc-400 hover:text-orange-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-zinc-700" />
                  <DropdownMenuItem className="hover:bg-zinc-700"
                  onClick={() => setSelectedServerId(server.id)}>
                   Channel 1
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-zinc-700"
                  onClick={() => setSelectedServerId(server.id)}>
                   Channel 2
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-zinc-700" />
                <DropdownMenuItem
                  className="hover:bg-zinc-700 text-red-500"
                  onClick={async () => {
                    const confirmDelete = window.confirm(
                      `Supprimer définitivement le serveur "${server.name}" ?`
                    );
                    if (!confirmDelete) return;

                    try {
                      const res = await fetch("http://localhost:3000/api/delete-server", {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ server_id: server.id }),
                      });

                      const data = await res.json();

                      if (!res.ok) {
                        alert(
                          data.error ||
                            "Erreur lors de la suppression du serveur. Vérifiez que vous êtes le fondateur."
                        );
                        return;
                      }

                      // Mettre à jour la liste des serveurs localement
                      setServers((prev) => prev.filter((s) => s.id !== server.id));
                      if (selectedServerId === server.id) {
                        setSelectedServerId(null);
                      }
                    } catch (err) {
                      console.error("Erreur lors de la suppression du serveur:", err);
                      alert("Erreur réseau lors de la suppression du serveur.");
                    }
                  }}
                >
                  Supprimer le serveur
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
          <button
            onClick={() => router.push("/create-serveur")}
            className="w-12 h-12 flex items-center justify-center rounded-full border-2 border-dashed border-orange-500 text-orange-500 hover:bg-orange-700/20 hover:border-orange-400 text-2xl font-bold transition-colors"
            aria-label="Ajouter un serveur"
          >
            +
          </button>
          <button
            onClick={() => router.push("/channels")}
            className="w-12 h-12 flex items-center justify-center rounded-full border-2 border-dashed border-orange-500 hover:bg-orange-700/20 hover:border-orange-400 bg-transparent transition-colors"
            aria-label="Rejoindre un serveur"
          >
            <img
              src="/right.png"
              alt="Rejoindre un serveur"
              className="w-6 h-6 object-contain"
            />
          </button>
        </div>

        
      </nav>

    </div>  
  )
}

  export {
    DropdownMenu,
    DropdownMenuPortal,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
  };

