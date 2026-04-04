import * as React from "react"
import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "w-full bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden", 
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("px-5 pt-5 pb-4", className)} {...props} />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("text-2xl font-bold", className)} {...props} />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("px-5 pb-5", className)} {...props} />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("px-5 py-4 border-t border-zinc-800", className)} {...props} />
  )
}

export {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
}